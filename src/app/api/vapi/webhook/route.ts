import { NextRequest, NextResponse } from "next/server";
import { parseVapiWebhook } from "@/lib/vapi";
import { triggerN8nWorkflow } from "@/lib/n8n";
import { getLead, getLeads, updateLead, createActivity, createLead, findLeadByPhoneOrEmail } from "@/lib/airtable";
import { scoreLeadWithCallData, generateOutreach } from "@/lib/langchain";
import { normalizePhone } from "@/lib/utils";

function formatDuration(seconds: number): string {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function extractStructuredOutputs(artifact: any): Record<string, any> {
  const outputs: Record<string, any> = {};
  if (artifact?.structuredOutputs) {
    for (const [key, value] of Object.entries(artifact.structuredOutputs)) {
      if (value && typeof value === "object" && "name" in value && "result" in value) {
        outputs[(value as any).name] = (value as any).result;
      }
    }
  }
  return outputs;
}

function extractNameFromTranscript(transcript?: string): string | null {
  if (!transcript) return null;
  const patterns = [
    /my name is ([A-Z][a-z]+ [A-Z][a-z]+)/i,
    /I'm ([A-Z][a-z]+ [A-Z][a-z]+)/i,
    /this is ([A-Z][a-z]+ [A-Z][a-z]+)/i,
    /call me ([A-Z][a-z]+)/i,
  ];
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractCompanyFromTranscript(transcript?: string): string | null {
  if (!transcript) return null;
  const patterns = [
    /I work (?:at|for) ([A-Z][A-Za-z0-9 ]+)/i,
    /from ([A-Z][A-Za-z0-9 ]+) (?:company|inc|llc|corp)/i,
    /company (?:is |called )?([A-Z][A-Za-z0-9 ]+)/i,
  ];
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractEmailFromTranscript(transcript?: string): string | null {
  if (!transcript) return null;
  const match = transcript.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("=== VAPI WEBHOOK RAW ===");
    console.log("body.message.type:", body.message?.type);
    console.log("All body keys:", Object.keys(body));

    if (body.message?.type !== "end-of-call-report") {
      console.log("Ignoring non-end-of-call event:", body.message?.type);
      return NextResponse.json({ received: true });
    }

    console.log("Processing end-of-call-report");
    console.log("Customer phone:", body.message?.customer?.number);
    console.log("Call analysis:", JSON.stringify(body.message?.analysis, null, 2));
    console.log("Artifact:", JSON.stringify(body.message?.artifact, null, 2));

    const result = parseVapiWebhook(body);
    const structuredOutputs = extractStructuredOutputs(body.message?.artifact);
    console.log("Extracted structured outputs:", JSON.stringify(structuredOutputs, null, 2));

    // Read call metadata
    const metadata = body.message?.call?.metadata || body.message?.metadata || {};
    const metadataLeadId = metadata.leadId;
    const callType = metadata.callType;
    const knownLead = metadata.knownLead;
    const customerPhone = body.message?.call?.customer?.number || result.customerPhone;
    console.log("Metadata leadId:", metadataLeadId, "callType:", callType, "knownLead:", knownLead);

    // Handle inbound call from an unknown caller — create or update lead
    if (callType === "inbound" && knownLead === false && customerPhone) {
      console.log("Handling inbound call from unknown caller:", customerPhone);

      const transcript = body.message?.transcript;
      const extractedName =
        structuredOutputs.caller_name ||
        structuredOutputs.name ||
        extractNameFromTranscript(transcript) ||
        "Unknown Caller";
      const extractedCompany =
        structuredOutputs.company_name ||
        structuredOutputs.company ||
        extractCompanyFromTranscript(transcript);
      const extractedEmail =
        structuredOutputs.email ||
        extractEmailFromTranscript(transcript) ||
        `${normalizePhone(customerPhone)}@unknown.com`;

      try {
        // Check if a lead already exists for this phone number
        const { existingLead } = await findLeadByPhoneOrEmail(customerPhone, undefined);

        if (existingLead) {
          console.log("Found existing lead for inbound phone, updating:", existingLead.id);
          await updateLead(existingLead.id, {
            vapiCallStatus: "Completed",
            vapiCallSummary: result.summary || "Inbound call",
            callCount: (existingLead.callCount || 0) + 1,
            lastCallDate: new Date().toISOString().split("T")[0],
            lastCallSummary: result.summary,
          });
          await createActivity({
            activityType: "Call Made",
            leadId: existingLead.id,
            description: `Inbound call received. Duration: ${formatDuration(result.duration || 0)}. ${result.summary || ""}`,
            outcome: result.outcome === "success" ? "Positive" : "Neutral",
          });
          return NextResponse.json({ success: true, leadId: existingLead.id, created: false });
        }

        const newLead = await createLead({
          name: extractedName,
          phone: normalizePhone(customerPhone),
          company: extractedCompany || undefined,
          email: extractedEmail,
          leadSource: "Cold Outreach",
          status: "New",
          vapiCallStatus: "Completed",
          vapiCallSummary: result.summary || "Inbound call",
          callCount: 1,
          lastCallDate: new Date().toISOString().split("T")[0],
          lastCallSummary: result.summary,
        });
        console.log("Created new lead from inbound call:", newLead.id);

        await createActivity({
          activityType: "Call Made",
          leadId: newLead.id,
          description: `Inbound call received. Duration: ${formatDuration(result.duration || 0)}. ${result.summary || ""}`,
          outcome: result.outcome === "success" ? "Positive" : "Neutral",
        });

        return NextResponse.json({ success: true, leadId: newLead.id, created: true });
      } catch (createError) {
        console.error("Failed to handle inbound call lead:", createError);
      }
    }

    // Look up lead: prefer metadata leadId, fall back to phone lookup
    let lead = null;

    if (metadataLeadId) {
      try {
        lead = await getLead(metadataLeadId);
        console.log("Found lead by metadata ID:", lead.id, lead.name);
      } catch (err) {
        console.error("Failed to get lead by metadata ID:", metadataLeadId, err);
      }
    }

    if (!lead && result.customerPhone) {
      console.log("Falling back to phone lookup");
      const digits = result.customerPhone.replace(/[^\d]/g, "").slice(-10);
      try {
        const { leads } = await getLeads({
          filterByFormula: `FIND("${digits}", SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE({Phone}, "-", ""), " ", ""), "(", ""), ")", ""))`,
          maxRecords: 1,
        });
        lead = leads[0] || null;
        console.log("Found lead by phone:", lead?.id, lead?.name);
      } catch (err) {
        console.error("Failed to look up lead by phone:", err);
      }
    }

    // Build call history entry
    const callHistoryEntry = {
      callId: result.callId,
      date: new Date().toISOString(),
      duration: result.duration,
      summary: result.summary,
      outcome: result.outcome,
      qualification: result.structuredData
        ? {
            budget: result.structuredData.budget_qualification,
            authority: result.structuredData.decision_maker,
            need: result.structuredData.needs_identified,
            timeline: result.structuredData.timeline,
          }
        : undefined,
      keyPoints: structuredOutputs.key_points || [],
      nextSteps: structuredOutputs.next_steps,
    };

    // Append to existing call history
    let callHistory: any[] = [];
    if (lead?.callHistory) {
      try {
        callHistory = JSON.parse(lead.callHistory);
      } catch {
        callHistory = [];
      }
    }
    callHistory.push(callHistoryEntry);

    // Check if a meeting was scheduled during the call
    const scheduledTime =
      structuredOutputs.scheduled_time || structuredOutputs.meeting_time || null;

    // Update Airtable lead with call results, always re-score, always regenerate outreach
    if (lead) {
      try {
        const previousScore = lead.aiScore;

        // Step 1: Save call data
        await updateLead(lead.id, {
          vapiCallStatus: result.status,
          vapiCallSummary: structuredOutputs.call_summary || result.summary || "Call completed",
          vapiCallData: JSON.stringify(structuredOutputs),
          lastCallDate: new Date().toISOString().split("T")[0],
          lastCallSummary: structuredOutputs.call_summary || result.summary,
          callCount: (lead.callCount || 0) + 1,
          callHistory: JSON.stringify(callHistory),
          ...(scheduledTime ? { scheduledMeeting: scheduledTime } : {}),
        });
        console.log("Updated Airtable with call data for lead:", lead.id);

        // Step 2: Always re-score based on call outcome (score can go up or down)
        console.log(`Re-scoring lead ${lead.name} (was: ${previousScore} ${lead.aiScoreLabel})...`);
        const reScoreResult = await scoreLeadWithCallData(lead, structuredOutputs);
        console.log(`New score: ${reScoreResult.score} ${reScoreResult.scoreLabel} (was: ${previousScore})`);

        // Calculate next follow-up date from followUpTiming string
        let nextFollowUpDate: string | undefined;
        const timing = (reScoreResult.followUpTiming || "").toLowerCase();
        if (timing && !timing.includes("do not")) {
          const now = Date.now();
          let daysToAdd = 0;
          if (timing.includes("2 day") || timing.includes("two day")) daysToAdd = 2;
          else if (timing.includes("3 day") || timing.includes("three day")) daysToAdd = 3;
          else if (timing.includes("1 week") || timing.includes("one week")) daysToAdd = 7;
          else if (timing.includes("2 week") || timing.includes("two week")) daysToAdd = 14;
          else if (timing.includes("1 month") || timing.includes("one month")) daysToAdd = 30;
          else if (timing.includes("2 month") || timing.includes("two month")) daysToAdd = 60;
          if (daysToAdd > 0) {
            nextFollowUpDate = new Date(now + daysToAdd * 86400000).toISOString().split("T")[0];
          }
        }

        await updateLead(lead.id, {
          aiScore: reScoreResult.score,
          aiScoreLabel: reScoreResult.scoreLabel,
          aiInsights: reScoreResult.insights,
          keyStrengths: reScoreResult.keyStrengths,
          concerns: reScoreResult.concerns,
          suggestedNextStep: reScoreResult.suggestedNextStep,
          ...(nextFollowUpDate ? { nextFollowUp: nextFollowUpDate } : {}),
        });

        // Step 3: Always regenerate outreach strategy based on new score + call context
        if (process.env.OPENAI_API_KEY) {
          try {
            const outreachTone =
              reScoreResult.score >= 70 ? "professional"
              : reScoreResult.score >= 40 ? "friendly"
              : "casual";
            const leadWithCallData = {
              ...lead,
              vapiCallData: JSON.stringify(structuredOutputs),
              aiScore: reScoreResult.score,
              aiInsights: reScoreResult.insights,
              suggestedNextStep: reScoreResult.suggestedNextStep,
            };
            const emailDraft = await generateOutreach(leadWithCallData as any, "email", outreachTone as any);
            const qualStatus = structuredOutputs.qualification_status || "";
            await updateLead(lead.id, {
              outreachStrategy: JSON.stringify({
                source: "post-call",
                call_outcome: qualStatus,
                recommended_channel: "Email",
                approach_tone: outreachTone,
                follow_up_email: { subject: emailDraft.subject, message: emailDraft.message },
                generated_at: new Date().toISOString(),
              }),
              recommendedChannel: "Email",
              approachTone: outreachTone.charAt(0).toUpperCase() + outreachTone.slice(1),
            });
            console.log("Outreach strategy regenerated post-call");
          } catch (outreachErr) {
            console.error("Failed to regenerate outreach after call:", outreachErr);
          }
        }

        const qualStatus = structuredOutputs.qualification_status;
        const callOutcome =
          qualStatus === "QUALIFIED" ? "Positive"
          : qualStatus === "NOT_QUALIFIED" ? "Negative"
          : "Neutral";
        try {
          await createActivity({
            activityType: "Call Made",
            leadId: lead.id,
            description:
              structuredOutputs.call_summary || result.summary || "AI qualification call completed",
            outcome: callOutcome,
          });
        } catch (err) {
          console.error("Failed to create call activity:", err);
        }
      } catch (err) {
        console.error("Failed to update/re-score lead:", err);
      }
    } else {
      console.log("No lead found, skipping Airtable update");
    }

    // Trigger n8n with enriched payload
    console.log("Step 5: Triggering n8n...");
    const n8nData: Record<string, any> = {
      lead_id: lead?.id || "",
      lead_name: lead?.name || "",
      lead_email: lead?.email || "",
      lead_company: lead?.company || "",
      lead_phone: result.customerPhone || "",
      call_id: body.message?.call?.id || result.callId,
      call_duration_seconds: body.message?.durationSeconds || result.duration || 0,
      call_duration_formatted: formatDuration(body.message?.durationSeconds || result.duration || 0),
      call_outcome: body.message?.endedReason || result.status,
      qualification_status: structuredOutputs.qualification_status || "",
      pain_points: structuredOutputs.pain_points || "",
      budget_range: structuredOutputs.budget_range || "",
      timeline: structuredOutputs.timeline || "",
      is_decision_maker: structuredOutputs.is_decision_maker ?? false,
      call_summary: structuredOutputs.call_summary || result.summary || "",
      next_steps: structuredOutputs.next_steps || "",
      transcript: body.message?.transcript || "",
      recording_url: body.message?.recordingUrl || "",
    };

    try {
      const n8nResult = await triggerN8nWorkflow("call_completed", n8nData);
      console.log("n8n triggered successfully:", JSON.stringify(n8nResult));
    } catch (err) {
      console.error("Failed to trigger n8n:", err);
    }

    return NextResponse.json({ received: true, leadId: lead?.id || null });
  } catch (error) {
    console.error("Vapi webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

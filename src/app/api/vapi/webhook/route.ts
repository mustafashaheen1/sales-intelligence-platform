import { NextRequest, NextResponse } from "next/server";
import { parseVapiWebhook } from "@/lib/vapi";
import { triggerN8nWorkflow } from "@/lib/n8n";
import { getLeads, updateLead } from "@/lib/airtable";
import { scoreLeadWithCallData } from "@/lib/langchain";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("=== VAPI WEBHOOK RAW ===");
    console.log("body.message.type:", body.message?.type);
    console.log("All body keys:", Object.keys(body));

    // Only process end-of-call-report events
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

    // Look up lead by phone number in Airtable (normalize to digits-only for matching)
    let lead = null;
    if (result.customerPhone) {
      const digits = result.customerPhone.replace(/[^\d]/g, "");
      console.log("Looking up lead by phone digits:", digits);
      try {
        const { leads } = await getLeads({
          filterByFormula: `FIND("${digits}", SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE({Phone}, "-", ""), " ", ""), "(", ""), ")", ""))`,
          maxRecords: 1,
        });
        lead = leads[0] || null;
        console.log("Found lead:", lead?.id, lead?.name);
      } catch (err) {
        console.error("Failed to look up lead by phone:", err);
      }
    } else {
      console.log("No customer phone found in webhook payload");
    }

    // Update Airtable lead with call results and re-score
    if (lead) {
      try {
        await updateLead(lead.id, {
          vapiCallStatus: result.status,
          vapiCallSummary: structuredOutputs.call_summary || result.summary || "Call completed",
          vapiCallData: JSON.stringify(structuredOutputs),
        });
        console.log("Updated Airtable with call data for lead:", lead.id);

        if (structuredOutputs.qualification_status || structuredOutputs.call_summary) {
          console.log("Re-scoring lead with call data...");
          const reScoreResult = await scoreLeadWithCallData(lead, structuredOutputs);
          await updateLead(lead.id, {
            aiScore: reScoreResult.score,
            aiScoreLabel: reScoreResult.scoreLabel,
            aiInsights: reScoreResult.insights,
            keyStrengths: reScoreResult.keyStrengths,
            concerns: reScoreResult.concerns,
            suggestedNextStep: reScoreResult.suggestedNextStep,
          });
          console.log("Lead re-scored:", reScoreResult.score, reScoreResult.scoreLabel);
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
      // Lead info
      lead_id: lead?.id || "",
      lead_name: lead?.name || "",
      lead_email: lead?.email || "",
      lead_company: lead?.company || "",
      lead_phone: result.customerPhone || "",

      // Call info
      call_id: body.message?.call?.id || result.callId,
      call_duration_seconds: body.message?.durationSeconds || result.duration || 0,
      call_duration_formatted: formatDuration(body.message?.durationSeconds || result.duration || 0),
      call_outcome: body.message?.endedReason || result.status,

      // AI analysis from Vapi structured outputs
      qualification_status: structuredOutputs.qualification_status || "",
      pain_points: structuredOutputs.pain_points || "",
      budget_range: structuredOutputs.budget_range || "",
      timeline: structuredOutputs.timeline || "",
      is_decision_maker: structuredOutputs.is_decision_maker ?? false,
      call_summary: structuredOutputs.call_summary || result.summary || "",
      next_steps: structuredOutputs.next_steps || "",

      // Extras
      transcript: body.message?.transcript || "",
      recording_url: body.message?.recordingUrl || "",
    };

    try {
      const n8nResult = await triggerN8nWorkflow("call_completed", n8nData);
      console.log("n8n triggered successfully:", JSON.stringify(n8nResult));
    } catch (err) {
      console.error("Failed to trigger n8n:", err);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Vapi webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { parseVapiWebhook } from "@/lib/vapi";
import { triggerN8nWorkflow } from "@/lib/n8n";
import { getLeads, updateLead } from "@/lib/airtable";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Only process end-of-call-report events
    if (body.message?.type !== "end-of-call-report") {
      return NextResponse.json({ received: true });
    }

    const result = parseVapiWebhook(body);
    const structured = result.structuredData || {};

    // Look up lead by phone number in Airtable
    let lead = null;
    if (result.customerPhone) {
      try {
        const { leads } = await getLeads({
          filterByFormula: `{Phone} = "${result.customerPhone}"`,
          maxRecords: 1,
        });
        lead = leads[0] || null;
      } catch (err) {
        console.error("Failed to look up lead by phone:", err);
      }
    }

    // Update Airtable lead with call results
    if (lead) {
      try {
        await updateLead(lead.id, {
          vapiCallStatus: result.status,
          vapiCallSummary: result.summary || structured.call_summary || "Call completed",
        });
      } catch (err) {
        console.error("Failed to update lead with call results:", err);
      }
    }

    // Trigger n8n with enriched payload
    const n8nData: Record<string, any> = {
      // Lead info
      lead_id: lead?.id || "",
      lead_name: lead?.name || "",
      lead_email: lead?.email || "",
      lead_company: lead?.company || "",
      lead_phone: result.customerPhone || "",

      // Call info
      call_id: result.callId,
      call_duration: result.duration || 0,
      call_duration_formatted: result.duration ? formatDuration(result.duration) : "0m 0s",
      call_outcome: result.status,

      // AI analysis from Vapi structured outputs
      qualification_status: structured.qualification_status || "",
      pain_points: structured.pain_points || "",
      budget_range: structured.budget_range || "",
      timeline: structured.timeline || "",
      is_decision_maker: structured.is_decision_maker ?? false,
      call_summary: result.summary || structured.call_summary || "",
      next_steps: structured.next_steps || "",
    };

    triggerN8nWorkflow("call_completed", n8nData).catch(console.error);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Vapi webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

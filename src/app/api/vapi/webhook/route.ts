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

    console.log("Vapi webhook received, type:", body.message?.type);

    // Only process end-of-call-report events
    if (body.message?.type !== "end-of-call-report") {
      console.log("Ignoring non-end-of-call event:", body.message?.type);
      return NextResponse.json({ received: true });
    }

    console.log("Processing end-of-call-report");
    console.log("Customer phone:", body.message?.customer?.number);
    console.log("Call analysis:", JSON.stringify(body.message?.analysis, null, 2));

    const result = parseVapiWebhook(body);
    const structured = result.structuredData || {};

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

    // Update Airtable lead with call results
    if (lead) {
      try {
        await updateLead(lead.id, {
          vapiCallStatus: result.status,
          vapiCallSummary: result.summary || structured.call_summary || "Call completed",
        });
        console.log("Updated Airtable for lead:", lead.id);
      } catch (err) {
        console.error("Failed to update lead with call results:", err);
      }
    } else {
      console.log("No lead found, skipping Airtable update");
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

    triggerN8nWorkflow("call_completed", n8nData)
      .then((res) => console.log("Triggered n8n webhook:", res))
      .catch(console.error);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Vapi webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

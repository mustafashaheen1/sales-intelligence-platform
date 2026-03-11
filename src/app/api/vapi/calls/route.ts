import { NextResponse } from "next/server";
import { getDemoCalls } from "@/lib/demo-data";
import { VapiCall, VapiCallStatus, Lead } from "@/types";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.VAPI_API_KEY;
}

function mapVapiCallStatus(vapiCall: any): VapiCallStatus {
  const status = vapiCall.status;
  const endedReason = vapiCall.endedReason;

  if (status === "ended") {
    if (endedReason === "no-answer") return "No Answer";
    if (endedReason === "busy") return "Callback Requested";
    return "Completed";
  }
  if (status === "queued" || status === "ringing") return "Scheduled";
  if (status === "in-progress" || status === "forwarding") return "Scheduled";
  return "Completed";
}

function mapVapiResponse(vapiCall: any, leadsByPhone: Map<string, Lead>): VapiCall {
  const startedAt = vapiCall.startedAt || vapiCall.createdAt;
  const endedAt = vapiCall.endedAt;
  let duration: number | undefined;
  if (startedAt && endedAt) {
    duration = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  }

  const customerPhone = vapiCall.customer?.number || "";
  const lead = customerPhone ? leadsByPhone.get(customerPhone) : undefined;

  return {
    id: vapiCall.id,
    leadId: lead?.id || "",
    leadName: lead?.name || vapiCall.customer?.name || customerPhone || "Unknown",
    phone: customerPhone,
    scheduledAt: startedAt,
    completedAt: endedAt,
    duration,
    outcome: vapiCall.analysis?.successEvaluation || undefined,
    summary: vapiCall.analysis?.summary || undefined,
    status: mapVapiCallStatus(vapiCall),
  };
}

export async function GET() {
  try {
    if (isDemoMode()) {
      return NextResponse.json({ calls: getDemoCalls() });
    }

    const { getVapiCalls } = await import("@/lib/vapi");
    const { getLeads } = await import("@/lib/airtable");

    const [rawCalls, { leads }] = await Promise.all([
      getVapiCalls(),
      getLeads({ maxRecords: 100 }),
    ]);

    // Build phone-to-lead lookup map
    const leadsByPhone = new Map<string, Lead>();
    for (const lead of leads) {
      if (lead.phone) {
        leadsByPhone.set(lead.phone, lead);
      }
    }

    const calls = rawCalls.map((c: any) => mapVapiResponse(c, leadsByPhone));
    return NextResponse.json({ calls });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch calls" }, { status: 500 });
  }
}

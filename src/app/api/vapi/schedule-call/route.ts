import { NextRequest, NextResponse } from "next/server";
import { scheduleVapiCall } from "@/lib/vapi";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.VAPI_API_KEY;
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, leadName, leadCompany, leadId } = await request.json();

    if (isDemoMode()) {
      await new Promise((r) => setTimeout(r, 1000));
      return NextResponse.json({
        callId: `call_demo_${Date.now()}`,
        status: "scheduled",
        message: "Call scheduled (demo mode)",
      });
    }

    const result = await scheduleVapiCall({ phoneNumber, leadName, leadCompany });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error scheduling call:", error);
    return NextResponse.json({ error: "Failed to schedule call" }, { status: 500 });
  }
}

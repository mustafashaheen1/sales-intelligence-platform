import { NextRequest, NextResponse } from "next/server";
import { parseVapiWebhook } from "@/lib/vapi";
import { triggerN8nWorkflow } from "@/lib/n8n";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = parseVapiWebhook(body);

    // Trigger n8n workflow for completed calls
    triggerN8nWorkflow("call_completed", result).catch(console.error);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Vapi webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

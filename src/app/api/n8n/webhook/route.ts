import { NextRequest, NextResponse } from "next/server";
import { verifyN8nWebhook } from "@/lib/n8n";

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-webhook-secret");
    if (!verifyN8nWebhook(secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("n8n webhook received:", body);

    // Process webhook payload (activity logging, status updates, etc.)
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

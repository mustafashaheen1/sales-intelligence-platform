import { NextRequest, NextResponse } from "next/server";
import { triggerN8nWorkflow, N8nTriggerType } from "@/lib/n8n";

export async function POST(request: NextRequest) {
  try {
    const { triggerType, data } = await request.json();

    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      return NextResponse.json({ success: true, message: "Workflow triggered (demo mode)" });
    }

    const result = await triggerN8nWorkflow(triggerType as N8nTriggerType, data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to trigger workflow" }, { status: 500 });
  }
}

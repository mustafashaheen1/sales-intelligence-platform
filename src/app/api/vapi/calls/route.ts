import { NextResponse } from "next/server";
import { getDemoCalls } from "@/lib/demo-data";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.VAPI_API_KEY;
}

export async function GET() {
  try {
    if (isDemoMode()) {
      return NextResponse.json({ calls: getDemoCalls() });
    }
    const { getVapiCalls } = await import("@/lib/vapi");
    const calls = await getVapiCalls();
    return NextResponse.json({ calls });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch calls" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getActivities } from "@/lib/airtable";
import { getDemoActivities } from "@/lib/demo-data";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (isDemoMode()) {
      const activities = getDemoActivities().filter((a) => a.leadId === params.id);
      return NextResponse.json({ activities });
    }
    const activities = await getActivities(params.id);
    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

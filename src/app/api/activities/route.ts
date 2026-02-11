import { NextRequest, NextResponse } from "next/server";
import { getActivities, createActivity } from "@/lib/airtable";
import { getDemoActivities } from "@/lib/demo-data";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

export async function GET() {
  try {
    if (isDemoMode()) {
      return NextResponse.json({ activities: getDemoActivities() });
    }
    const activities = await getActivities();
    return NextResponse.json({ activities });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (isDemoMode()) {
      return NextResponse.json({
        activity: {
          id: `act_demo_${Date.now()}`,
          ...body,
          createdAt: new Date().toISOString(),
        },
      });
    }
    const activity = await createActivity(body);
    return NextResponse.json({ activity });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}

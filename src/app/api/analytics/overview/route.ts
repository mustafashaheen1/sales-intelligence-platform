import { NextResponse } from "next/server";
import { getDemoAnalyticsOverview, getDemoLeads } from "@/lib/demo-data";
import { getLeads } from "@/lib/airtable";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

export async function GET() {
  try {
    if (isDemoMode()) {
      return NextResponse.json(getDemoAnalyticsOverview());
    }

    const { leads } = await getLeads({ maxRecords: 1000 });
    const overview = {
      totalLeads: leads.length,
      hotLeads: leads.filter((l) => (l.aiScore ?? 0) >= 70).length,
      warmLeads: leads.filter((l) => (l.aiScore ?? 0) >= 40 && (l.aiScore ?? 0) < 70).length,
      coldLeads: leads.filter((l) => (l.aiScore ?? 0) < 40).length,
      conversionRate: leads.length > 0 ? Math.round((leads.filter((l) => l.status === "Won").length / leads.length) * 100) : 0,
      callsScheduledToday: leads.filter((l) => l.vapiCallStatus === "Scheduled").length,
    };
    return NextResponse.json(overview);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

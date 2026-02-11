import { NextResponse } from "next/server";
import { getDemoSourceData } from "@/lib/demo-data";
import { getLeads } from "@/lib/airtable";
import { LeadSource } from "@/types";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

export async function GET() {
  try {
    if (isDemoMode()) {
      return NextResponse.json({ sources: getDemoSourceData() });
    }

    const { leads } = await getLeads({ maxRecords: 1000 });
    const sources: LeadSource[] = ["Website", "LinkedIn", "Referral", "Cold Outreach", "Event"];
    const sourceData = sources
      .map((source) => ({
        source,
        count: leads.filter((l) => l.leadSource === source).length,
      }))
      .filter((s) => s.count > 0);
    return NextResponse.json({ sources: sourceData });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 });
  }
}

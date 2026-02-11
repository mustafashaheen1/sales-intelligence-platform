import { NextResponse } from "next/server";
import { getDemoPipelineData } from "@/lib/demo-data";
import { getLeads } from "@/lib/airtable";
import { LeadStatus } from "@/types";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

export async function GET() {
  try {
    if (isDemoMode()) {
      return NextResponse.json({ pipeline: getDemoPipelineData() });
    }

    const { leads } = await getLeads({ maxRecords: 1000 });
    const statuses: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];
    const pipeline = statuses.map((status) => ({
      status,
      count: leads.filter((l) => l.status === status).length,
    }));
    return NextResponse.json({ pipeline });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pipeline" }, { status: 500 });
  }
}

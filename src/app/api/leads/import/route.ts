import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/airtable";
import { getScoreLabel } from "@/lib/utils";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

export async function POST(request: NextRequest) {
  try {
    const { leads: leadsData } = await request.json();

    if (isDemoMode()) {
      const imported = leadsData.map((data: any, i: number) => {
        const score = Math.floor(Math.random() * 60) + 30;
        return {
          id: `rec_import_${Date.now()}_${i}`,
          ...data,
          status: "New",
          aiScore: score,
          aiScoreLabel: getScoreLabel(score),
          createdAt: new Date().toISOString(),
        };
      });
      return NextResponse.json({ imported, count: imported.length });
    }

    const results = [];
    for (const data of leadsData) {
      try {
        const lead = await createLead({ ...data, status: "New" });
        results.push(lead);
      } catch (err) {
        console.error("Failed to import lead:", data.name, err);
      }
    }

    return NextResponse.json({ imported: results, count: results.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to import leads" }, { status: 500 });
  }
}

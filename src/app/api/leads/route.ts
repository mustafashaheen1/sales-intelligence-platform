import { NextRequest, NextResponse } from "next/server";
import { getLeads, createLead } from "@/lib/airtable";
import { getDemoLeads } from "@/lib/demo-data";
import { scoreLead } from "@/lib/langchain";
import { triggerN8nWorkflow } from "@/lib/n8n";
import { getScoreLabel } from "@/lib/utils";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

export async function GET(request: NextRequest) {
  try {
    if (isDemoMode()) {
      let leads = getDemoLeads();
      const searchParams = request.nextUrl.searchParams;
      const search = searchParams.get("search");
      const scoreLabel = searchParams.get("scoreLabel");
      const status = searchParams.get("status");
      const source = searchParams.get("source");

      if (search) {
        const q = search.toLowerCase();
        leads = leads.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            l.email.toLowerCase().includes(q) ||
            (l.company || "").toLowerCase().includes(q)
        );
      }
      if (scoreLabel) {
        leads = leads.filter((l) => l.aiScoreLabel === scoreLabel);
      }
      if (status) {
        leads = leads.filter((l) => l.status === status);
      }
      if (source) {
        leads = leads.filter((l) => l.leadSource === source);
      }

      return NextResponse.json({ leads, total: leads.length });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters: string[] = [];
    const search = searchParams.get("search");
    const scoreLabel = searchParams.get("scoreLabel");
    const status = searchParams.get("status");
    const source = searchParams.get("source");

    if (search) {
      filters.push(`OR(FIND(LOWER("${search}"), LOWER({Name})), FIND(LOWER("${search}"), LOWER({Email})), FIND(LOWER("${search}"), LOWER({Company})))`);
    }
    if (scoreLabel) filters.push(`{AI Score Label} = "${scoreLabel}"`);
    if (status) filters.push(`{Status} = "${status}"`);
    if (source) filters.push(`{Lead Source} = "${source}"`);

    const filterByFormula = filters.length > 1 ? `AND(${filters.join(", ")})` : filters[0] || "";

    const result = await getLeads({
      filterByFormula,
      sort: [{ field: "Created", direction: "desc" }],
    });

    return NextResponse.json({ leads: result.leads, total: result.leads.length });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (isDemoMode()) {
      const newLead = {
        id: `rec_demo_${Date.now()}`,
        ...body,
        status: body.status || "New",
        aiScore: Math.floor(Math.random() * 60) + 30,
        createdAt: new Date().toISOString(),
      };
      newLead.aiScoreLabel = getScoreLabel(newLead.aiScore);
      return NextResponse.json({ lead: newLead });
    }

    let lead = await createLead({
      ...body,
      status: body.status || "New",
    });

    // Auto-score with AI if OpenAI key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const scoreResult = await scoreLead(body);
        const { updateLead } = await import("@/lib/airtable");
        lead = await updateLead(lead.id, {
          aiScore: scoreResult.score,
          aiScoreLabel: scoreResult.scoreLabel,
          aiInsights: scoreResult.insights,
          keyStrengths: scoreResult.keyStrengths,
          concerns: scoreResult.concerns,
          suggestedNextStep: scoreResult.suggestedNextStep,
        });

        // Trigger n8n for hot leads
        if (scoreResult.score >= 70) {
          triggerN8nWorkflow("hot_lead", {
            lead,
            score: scoreResult,
          }).catch(console.error);
        }
      } catch (aiError) {
        console.error("AI scoring failed:", aiError);
      }
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}

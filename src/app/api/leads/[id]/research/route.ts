import { NextRequest, NextResponse } from "next/server";
import { getLead, updateLead } from "@/lib/airtable";
import { researchCompany } from "@/lib/relevance-ai";
import { getDemoLeads } from "@/lib/demo-data";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (isDemoMode()) {
      const lead = getDemoLeads().find((l) => l.id === params.id);
      if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

      await new Promise((r) => setTimeout(r, 2000));
      const mockResearch = {
        company_overview: "A leading technology company focused on AI-powered solutions for enterprise clients.",
        products_services: ["AI Analytics Platform", "Data Integration Suite", "Custom ML Models"],
        target_market: "Mid-market and enterprise B2B companies",
        competitors: ["Competitor A", "Competitor B", "Competitor C"],
        recent_news: ["Series B funding of $25M", "Expanded to European market", "Launched new AI product line"],
        tech_stack: ["React", "Python", "AWS", "Kubernetes"],
        company_culture: "Innovation-driven with a focus on remote-first work culture.",
        growth_signals: ["Hiring 50+ engineers", "Revenue grew 150% YoY", "Opened 3 new offices"],
        potential_challenges: ["Competitive market", "Scaling infrastructure", "Talent retention"],
        strategic_recommendations: "Focus on demonstrating ROI through case studies and offer a pilot program to reduce adoption friction.",
      };
      return NextResponse.json({
        lead: {
          ...lead,
          companyResearch: JSON.stringify({ answer: JSON.stringify(mockResearch) }),
          researchedAt: new Date().toISOString().split("T")[0],
        },
      });
    }

    if (!process.env.RELEVANCE_AI_API_KEY || !process.env.RELEVANCE_AI_RESEARCH_TOOL_ID) {
      return NextResponse.json({ error: "Relevance AI Company Research not configured" }, { status: 400 });
    }

    const lead = await getLead(params.id);

    if (!lead.company) {
      return NextResponse.json({ error: "Lead has no company name for research" }, { status: 400 });
    }

    const result = await researchCompany(lead);

    const output = result.output || result;

    const updateData: Record<string, any> = {
      companyResearch: JSON.stringify(output),
      researchedAt: new Date().toISOString().split("T")[0],
    };

    // Update industry if research provides it and lead doesn't have it
    if (output.industry && !lead.industry) updateData.industry = output.industry;

    const updatedLead = await updateLead(params.id, updateData);
    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    console.error("Error researching company:", error);
    return NextResponse.json({ error: "Failed to research company" }, { status: 500 });
  }
}

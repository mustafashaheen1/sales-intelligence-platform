import { NextRequest, NextResponse } from "next/server";
import { getLead, updateLead, findCompanyByName, createCompany, updateCompany, getCompany } from "@/lib/airtable";
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
        lead,
        company: {
          id: "comp_demo",
          name: lead.company || "Unknown",
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

    // Find or create company in Companies table
    let company = await findCompanyByName(lead.company);

    if (!company) {
      // Create new company record
      company = await createCompany({
        name: lead.company,
        website: lead.website,
        industry: lead.industry,
        companySize: lead.companySize,
        linkedinUrl: lead.companyLinkedin,
      });
    }

    // If already researched, return existing data
    if (company.companyResearch) {
      // Link lead to company if not already linked
      if (!lead.companyLinkId) {
        const updatedLead = await updateLead(params.id, { companyLinkId: company.id });
        return NextResponse.json({ lead: updatedLead, company });
      }
      return NextResponse.json({ lead, company });
    }

    // Call Relevance AI with company data
    const result = await researchCompany(company);
    const output = result.output || result;

    // Save research results to Companies table
    const companyUpdate: Record<string, any> = {
      companyResearch: JSON.stringify(output),
      researchedAt: new Date().toISOString().split("T")[0],
    };

    // Update company fields from research if missing
    if (output.industry && !company.industry) companyUpdate.industry = output.industry;
    if (output.company_size && !company.companySize) companyUpdate.companySize = output.company_size;

    const updatedCompany = await updateCompany(company.id, companyUpdate);

    // Link lead to company if not already linked
    let updatedLead = lead;
    if (!lead.companyLinkId) {
      updatedLead = await updateLead(params.id, { companyLinkId: company.id });
    }

    return NextResponse.json({ lead: updatedLead, company: updatedCompany });
  } catch (error) {
    console.error("Error researching company:", error);
    return NextResponse.json({ error: "Failed to research company" }, { status: 500 });
  }
}

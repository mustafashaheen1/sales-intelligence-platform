import { NextRequest, NextResponse } from "next/server";
import { getLead, updateLead, findCompanyByName, createCompany, updateCompany } from "@/lib/airtable";
import { enrichLead, researchCompany } from "@/lib/relevance-ai";
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
          companySize: "50-200 employees",
          industry: "Technology",
          companyLinkedin: "https://linkedin.com/company/example",
          enrichedAt: new Date().toISOString().split("T")[0],
          enrichmentData: JSON.stringify({
            answer: JSON.stringify({
              company_summary: "A leading technology company specializing in SaaS solutions.",
              industry: "Technology",
              estimated_company_size: "50-200 employees",
              estimated_revenue: "$10M-$50M",
              lead_role_analysis: "Decision maker with direct influence over technology purchases.",
              seniority_level: "C-Level",
              likely_pain_points: ["Manual processes slowing growth", "Data silos across departments", "Need for better analytics"],
              ai_automation_opportunities: ["Sales pipeline automation", "Customer onboarding workflows", "Report generation"],
              recommended_approach: "Lead with ROI-focused case studies from similar companies in their industry.",
              talking_points: ["Their recent expansion creates new automation needs", "Competitors are already adopting AI solutions", "Quick wins possible in their sales workflow"],
              icp_fit_score: 8,
              icp_fit_reason: "Strong fit based on company size, industry, and decision-maker role.",
            }),
          }),
        },
        company: {
          id: "comp_demo",
          name: lead.company || "Unknown",
          companyResearch: JSON.stringify({ answer: JSON.stringify(mockResearch) }),
          researchedAt: new Date().toISOString().split("T")[0],
        },
      });
    }

    const lead = await getLead(params.id);

    // Run both enrichment and company research in parallel
    const hasEnrichConfig = process.env.RELEVANCE_AI_API_KEY && process.env.RELEVANCE_AI_ENRICH_TOOL_ID;
    const hasResearchConfig = process.env.RELEVANCE_AI_API_KEY && process.env.RELEVANCE_AI_RESEARCH_TOOL_ID;

    if (!hasEnrichConfig && !hasResearchConfig) {
      return NextResponse.json({ error: "Relevance AI not configured" }, { status: 400 });
    }

    const promises: [Promise<Record<string, any>> | null, Promise<Record<string, any>> | null] = [
      hasEnrichConfig ? enrichLead(lead) : null,
      hasResearchConfig && lead.company ? researchCompany(lead.company) : null,
    ];

    const [enrichResult, researchResult] = await Promise.all(
      promises.map((p) => p ? p.catch((err) => { console.error("Enrichment/Research partial error:", err); return null; }) : null)
    );

    // Build lead update payload
    const updateData: Record<string, any> = {
      enrichedAt: new Date().toISOString().split("T")[0],
    };

    if (enrichResult) {
      const enrichOutput = enrichResult.output || enrichResult;
      updateData.enrichmentData = JSON.stringify(enrichOutput);

      // Fill empty lead fields from enrichment
      if (enrichOutput.company && !lead.company) updateData.company = enrichOutput.company;
      if ((enrichOutput.title || enrichOutput.job_title) && !lead.title) updateData.title = enrichOutput.title || enrichOutput.job_title;
      if (enrichOutput.linkedin_url && !lead.linkedinUrl) updateData.linkedinUrl = enrichOutput.linkedin_url;
      if (enrichOutput.company_size && !lead.companySize) updateData.companySize = enrichOutput.company_size;
      if (enrichOutput.industry && !lead.industry) updateData.industry = enrichOutput.industry;
      if (enrichOutput.company_linkedin && !lead.companyLinkedin) updateData.companyLinkedin = enrichOutput.company_linkedin;
      if (enrichOutput.website && !lead.website) updateData.website = enrichOutput.website;
    }

    // Handle company research - find or create company, save research
    let company = null;
    const companyName = lead.company || updateData.company;

    if (companyName) {
      company = await findCompanyByName(companyName);

      if (!company) {
        company = await createCompany({
          name: companyName,
          website: lead.website || updateData.website,
          industry: lead.industry || updateData.industry,
          companySize: lead.companySize || updateData.companySize,
          linkedinUrl: lead.companyLinkedin || updateData.companyLinkedin,
        });
      }

      if (researchResult) {
        const researchOutput = researchResult.output || researchResult;
        const companyUpdate: Record<string, any> = {
          companyResearch: JSON.stringify(researchOutput),
          researchedAt: new Date().toISOString().split("T")[0],
        };

        if (researchOutput.industry && !company.industry) companyUpdate.industry = researchOutput.industry;
        if (researchOutput.company_size && !company.companySize) companyUpdate.companySize = researchOutput.company_size;
        if (researchOutput.website && !company.website) companyUpdate.website = researchOutput.website;

        company = await updateCompany(company.id, companyUpdate);
      }

      // Link lead to company
      if (!lead.companyLinkId || lead.companyLinkId !== company.id) {
        updateData.companyLinkId = company.id;
      }
    }

    const updatedLead = await updateLead(params.id, updateData);
    return NextResponse.json({ lead: updatedLead, company });
  } catch (error) {
    console.error("Error enriching lead:", error);
    return NextResponse.json({ error: "Failed to enrich lead" }, { status: 500 });
  }
}

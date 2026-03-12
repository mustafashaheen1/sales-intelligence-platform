import { NextRequest, NextResponse } from "next/server";
import { getLead, updateLead, findCompanyByName, createCompany, updateCompany } from "@/lib/airtable";
import { enrichLead, researchCompany, generateOutreachStrategy } from "@/lib/relevance-ai";
import { getDemoLeads } from "@/lib/demo-data";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

function parseNestedJson(raw: any): any {
  if (!raw) return null;
  const output = raw.output || raw;
  if (output.answer && typeof output.answer === "string") {
    try { return JSON.parse(output.answer); } catch { return output; }
  }
  if (output.answer && typeof output.answer === "object") return output.answer;
  return output;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (isDemoMode()) {
      const lead = getDemoLeads().find((l) => l.id === params.id);
      if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

      await new Promise((r) => setTimeout(r, 2500));

      const mockEnrichment = {
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
      };

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

      const mockOutreach = {
        recommended_channel: "Email",
        approach_tone: "Consultative & Value-Driven",
        best_time_to_reach: "Tuesday-Thursday, 9-11 AM local time",
        personalization_hooks: [
          "Reference their recent Series B funding and growth trajectory",
          "Mention pain points around manual processes in their tech stack",
          "Connect AI automation to their expansion goals",
        ],
        outreach_sequence: [
          { step: 1, channel: "Email", timing: "Day 1", subject: `Quick question about ${lead.company || "your"} AI strategy`, message: `Hi ${lead.name.split(" ")[0]},\n\nI noticed ${lead.company || "your company"} recently raised Series B funding — congrats! Companies at your stage often face a critical inflection point with manual processes.\n\nWe've helped similar ${mockEnrichment.industry} companies automate their sales pipeline and reduce manual work by 60%.\n\nWould you have 15 minutes this week to explore if there's a fit?\n\nBest,\nSarah` },
          { step: 2, channel: "LinkedIn", timing: "Day 3", subject: null, message: `Hi ${lead.name.split(" ")[0]}, I came across ${lead.company || "your company"}'s work in ${mockEnrichment.industry} — impressive growth! I work with companies at your stage on AI-powered automation. Would love to connect and share some relevant insights.` },
          { step: 3, channel: "Email", timing: "Day 7", subject: `${lead.company || "Your team"} + AI automation case study`, message: `Hi ${lead.name.split(" ")[0]},\n\nFollowing up on my earlier note. I wanted to share a quick case study of how a ${mockEnrichment.estimated_company_size} ${mockEnrichment.industry} company similar to ${lead.company || "yours"} achieved:\n\n- 60% reduction in manual data entry\n- 3x faster lead qualification\n- $2M+ in additional pipeline\n\nHappy to walk through specifics if helpful.\n\nBest,\nSarah` },
          { step: 4, channel: "Phone", timing: "Day 10", subject: null, message: `Brief call script: Reference previous emails, mention the case study, ask about their current automation stack and biggest bottleneck.` },
        ],
        objection_handling: [
          { objection: "We already have a solution in place", response: "That's great that you're already investing in this area. Many of our clients had existing solutions before switching — the key difference is our AI-native approach. Would it be worth a quick comparison?" },
          { objection: "Not a priority right now", response: "Completely understand. Most of our clients felt the same before seeing how quickly we can show ROI. Could I send over a 2-minute case study for when timing is better?" },
          { objection: "Budget constraints", response: "I hear you. That's actually why many teams in the $10-50M range choose us — our ROI typically shows within 90 days. Would it help to see a cost-benefit breakdown?" },
        ],
        discovery_questions: [
          "What does your current sales process look like from lead to close?",
          "Where are the biggest bottlenecks in your team's workflow?",
          "How are you currently using AI or automation in your sales process?",
          "What would success look like for a tool like this in the next 6 months?",
          "Who else would be involved in evaluating a solution like this?",
        ],
        meeting_agenda: [
          { duration: "5 min", topic: "Introductions & confirm goals for the call" },
          { duration: "10 min", topic: "Understand current workflow and pain points" },
          { duration: "10 min", topic: "Demo of relevant features tailored to their use case" },
          { duration: "5 min", topic: "ROI discussion and next steps" },
        ],
      };

      return NextResponse.json({
        lead: {
          ...lead,
          companySize: "50-200 employees",
          industry: "Technology",
          companyLinkedin: "https://linkedin.com/company/example",
          enrichedAt: new Date().toISOString().split("T")[0],
          enrichmentData: JSON.stringify({ answer: JSON.stringify(mockEnrichment) }),
          outreachStrategy: JSON.stringify({ answer: JSON.stringify(mockOutreach) }),
          recommendedChannel: mockOutreach.recommended_channel,
          approachTone: mockOutreach.approach_tone,
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

    // Step 1 & 2: Run lead enrichment and company research in parallel
    const hasEnrichConfig = process.env.RELEVANCE_AI_API_KEY && process.env.RELEVANCE_AI_ENRICH_TOOL_ID;
    const hasResearchConfig = process.env.RELEVANCE_AI_API_KEY && process.env.RELEVANCE_AI_RESEARCH_TOOL_ID;
    const hasOutreachConfig = process.env.RELEVANCE_AI_API_KEY && process.env.RELEVANCE_AI_OUTREACH_TOOL_ID;

    if (!hasEnrichConfig && !hasResearchConfig) {
      return NextResponse.json({ error: "Relevance AI not configured" }, { status: 400 });
    }

    const [enrichResult, researchResult] = await Promise.all([
      hasEnrichConfig ? enrichLead(lead).catch((err) => { console.error("Enrich error:", err); return null; }) : null,
      hasResearchConfig && lead.company ? researchCompany(lead.company).catch((err) => { console.error("Research error:", err); return null; }) : null,
    ]);

    // Parse enrichment and research results
    const enrichData = enrichResult ? parseNestedJson(enrichResult) : null;
    const researchData = researchResult ? parseNestedJson(researchResult) : null;

    // Build lead update payload
    const updateData: Record<string, any> = {
      enrichedAt: new Date().toISOString().split("T")[0],
    };

    if (enrichResult) {
      const enrichOutput = enrichResult.output || enrichResult;
      updateData.enrichmentData = JSON.stringify(enrichOutput);

      // Fill empty lead fields from enrichment
      if (enrichData?.company && !lead.company) updateData.company = enrichData.company;
      if ((enrichData?.title || enrichData?.job_title) && !lead.title) updateData.title = enrichData.title || enrichData.job_title;
      if (enrichData?.linkedin_url && !lead.linkedinUrl) updateData.linkedinUrl = enrichData.linkedin_url;
      if (enrichData?.company_size && !lead.companySize) updateData.companySize = enrichData.company_size;
      if (enrichData?.estimated_company_size && !lead.companySize) updateData.companySize = enrichData.estimated_company_size;
      if (enrichData?.industry && !lead.industry) updateData.industry = enrichData.industry;
      if (enrichData?.company_linkedin && !lead.companyLinkedin) updateData.companyLinkedin = enrichData.company_linkedin;
      if (enrichData?.website && !lead.website) updateData.website = enrichData.website;
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

        if (researchData?.industry && !company.industry) companyUpdate.industry = researchData.industry;
        if (researchData?.company_size && !company.companySize) companyUpdate.companySize = researchData.company_size;
        if (researchData?.website && !company.website) companyUpdate.website = researchData.website;

        company = await updateCompany(company.id, companyUpdate);
      }

      // Link lead to company
      if (!lead.companyLinkId || lead.companyLinkId !== company.id) {
        updateData.companyLinkId = company.id;
      }
    }

    // Step 3: Run outreach strategy generation with combined data from steps 1 & 2
    if (hasOutreachConfig) {
      try {
        const outreachResult = await generateOutreachStrategy({
          lead_name: lead.name,
          lead_email: lead.email,
          job_title: enrichData?.title || enrichData?.job_title || lead.title || "",
          lead_seniority: enrichData?.seniority_level || "",
          company_name: companyName || "",
          company_industry: enrichData?.industry || researchData?.industry || lead.industry || "",
          company_size: enrichData?.estimated_company_size || enrichData?.company_size || lead.companySize || "",
          company_revenue: enrichData?.estimated_revenue || "",
          pain_points: Array.isArray(enrichData?.likely_pain_points) ? enrichData.likely_pain_points.join(", ") : "",
          ai_opportunities: Array.isArray(enrichData?.ai_automation_opportunities) ? enrichData.ai_automation_opportunities.join(", ") : "",
          icp_fit_score: enrichData?.icp_fit_score || 0,
        });

        const outreachOutput = outreachResult.output || outreachResult;
        const outreachData = parseNestedJson(outreachResult);

        updateData.outreachStrategy = JSON.stringify(outreachOutput);
        if (outreachData?.recommended_channel) updateData.recommendedChannel = outreachData.recommended_channel;
        if (outreachData?.approach_tone) updateData.approachTone = outreachData.approach_tone;
      } catch (err) {
        console.error("Outreach strategy error:", err);
        // Continue without outreach — save partial data from enrichment + research
      }
    }

    const updatedLead = await updateLead(params.id, updateData);
    return NextResponse.json({ lead: updatedLead, company });
  } catch (error) {
    console.error("Error enriching lead:", error);
    return NextResponse.json({ error: "Failed to enrich lead" }, { status: 500 });
  }
}

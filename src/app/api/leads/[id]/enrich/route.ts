import { NextRequest, NextResponse } from "next/server";
import { getLead, updateLead } from "@/lib/airtable";
import { enrichLead } from "@/lib/relevance-ai";
import { getDemoLeads } from "@/lib/demo-data";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (isDemoMode()) {
      const lead = getDemoLeads().find((l) => l.id === params.id);
      if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

      await new Promise((r) => setTimeout(r, 1500));
      return NextResponse.json({
        lead: {
          ...lead,
          companySize: "50-200 employees",
          industry: "Technology",
          companyLinkedin: "https://linkedin.com/company/example",
          enrichedAt: new Date().toISOString(),
          enrichmentData: JSON.stringify({
            company_size: "50-200 employees",
            industry: "Technology",
            company_linkedin: "https://linkedin.com/company/example",
            description: "A leading technology company specializing in SaaS solutions.",
          }),
        },
      });
    }

    if (!process.env.RELEVANCE_AI_API_KEY || !process.env.RELEVANCE_AI_ENRICH_TOOL_ID) {
      return NextResponse.json({ error: "Relevance AI not configured" }, { status: 400 });
    }

    const lead = await getLead(params.id);
    const result = await enrichLead(lead);

    // Extract output from Relevance AI response
    const output = result.output || result;

    // Build update payload from enrichment results
    const updateData: Record<string, any> = {
      enrichmentData: JSON.stringify(output),
      enrichedAt: new Date().toISOString(),
    };

    // Update existing fields if enrichment provides better data
    if (output.company && !lead.company) updateData.company = output.company;
    if (output.title || output.job_title) {
      if (!lead.title) updateData.title = output.title || output.job_title;
    }
    if (output.linkedin_url && !lead.linkedinUrl) updateData.linkedinUrl = output.linkedin_url;

    // Set new enrichment-specific fields
    if (output.company_size) updateData.companySize = output.company_size;
    if (output.industry) updateData.industry = output.industry;
    if (output.company_linkedin) updateData.companyLinkedin = output.company_linkedin;

    const updatedLead = await updateLead(params.id, updateData);
    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    console.error("Error enriching lead:", error);
    return NextResponse.json({ error: "Failed to enrich lead" }, { status: 500 });
  }
}

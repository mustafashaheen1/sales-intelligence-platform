import { Lead } from "@/types";

export async function enrichLead(lead: Partial<Lead>): Promise<Record<string, any>> {
  const apiKey = process.env.RELEVANCE_AI_API_KEY;
  const projectId = process.env.RELEVANCE_AI_PROJECT_ID;
  const region = process.env.RELEVANCE_AI_REGION || "us-east-1";
  const toolId = process.env.RELEVANCE_AI_ENRICH_TOOL_ID;

  if (!apiKey || !projectId || !toolId) {
    throw new Error("Relevance AI credentials not configured");
  }

  const url = `https://api-${region}.stack.tryrelevance.com/latest/studios/${toolId}/trigger_limited`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${projectId}:${apiKey}`,
    },
    body: JSON.stringify({
      params: {
        lead_name: lead.name || "",
        lead_email: lead.email || "",
        company_name: lead.company || "",
        job_title: lead.title || "",
        linkedin_url: lead.linkedinUrl || "",
      },
      project: projectId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Relevance AI error: ${error}`);
  }

  return response.json();
}

export async function researchCompany(companyName: string): Promise<Record<string, any>> {
  const apiKey = process.env.RELEVANCE_AI_API_KEY;
  const projectId = process.env.RELEVANCE_AI_PROJECT_ID;
  const region = process.env.RELEVANCE_AI_REGION || "d7b62b";
  const toolId = process.env.RELEVANCE_AI_RESEARCH_TOOL_ID;

  if (!apiKey || !projectId || !toolId) {
    throw new Error("Relevance AI Company Research credentials not configured");
  }

  const url = `https://api-${region}.stack.tryrelevance.com/latest/studios/${toolId}/trigger_limited`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${projectId}:${apiKey}`,
    },
    body: JSON.stringify({
      params: {
        company_name: companyName,
      },
      project: projectId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Relevance AI Company Research error: ${error}`);
  }

  return response.json();
}

export async function generateOutreach(params: {
  lead_name: string;
  lead_email: string;
  job_title: string;
  lead_seniority: string;
  company_name: string;
  company_industry: string;
  company_size: string;
  company_revenue: string;
  pain_points: string;
  ai_opportunities: string;
  icp_fit_score: number;
  message_type: string;
  tone: string;
}): Promise<Record<string, any>> {
  const apiKey = process.env.RELEVANCE_AI_API_KEY;
  const projectId = process.env.RELEVANCE_AI_PROJECT_ID;
  const region = process.env.RELEVANCE_AI_REGION || "d7b62b";
  const toolId = process.env.RELEVANCE_AI_OUTREACH_TOOL_ID;

  if (!apiKey || !projectId || !toolId) {
    throw new Error("Relevance AI Outreach Generator credentials not configured");
  }

  const url = `https://api-${region}.stack.tryrelevance.com/latest/studios/${toolId}/trigger_limited`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${projectId}:${apiKey}`,
    },
    body: JSON.stringify({
      params: {
        lead_name: params.lead_name,
        lead_email: params.lead_email,
        job_title: params.job_title,
        lead_seniority: params.lead_seniority,
        company_name: params.company_name,
        company_industry: params.company_industry,
        company_size: params.company_size,
        company_revenue: params.company_revenue,
        pain_points: params.pain_points,
        ai_opportunities: params.ai_opportunities,
        icp_fit_score: params.icp_fit_score,
        message_type: params.message_type,
        tone: params.tone,
      },
      project: projectId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Relevance AI Outreach Generator error: ${error}`);
  }

  return response.json();
}

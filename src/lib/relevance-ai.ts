import { Lead } from "@/types";

const COMPETITOR_TOOL_ID = process.env.RELEVANCE_COMPETITOR_TOOL_ID;

async function triggerRelevanceTool(toolId: string, params: Record<string, any>): Promise<any> {
  const apiKey = process.env.RELEVANCE_AI_API_KEY;
  const projectId = process.env.RELEVANCE_AI_PROJECT_ID;
  const region = process.env.RELEVANCE_AI_REGION || "d7b62b";

  if (!apiKey || !projectId) {
    throw new Error("Relevance AI credentials not configured");
  }

  const url = `https://api-${region}.stack.tryrelevance.com/latest/studios/${toolId}/trigger_limited`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${projectId}:${apiKey}`,
    },
    body: JSON.stringify({ params, project: projectId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Relevance AI error: ${error}`);
  }

  return response.json();
}

function parseNestedJson(raw: any): any {
  if (!raw) return {};
  const output = raw.output || raw;
  if (output.answer && typeof output.answer === "string") {
    try {
      const cleaned = output.answer.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return output;
    }
  }
  if (output.answer && typeof output.answer === "object") return output.answer;
  return output;
}

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
        icp_fit_score: String(params.icp_fit_score || 50),
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

export async function researchCompetitors(params: {
  companyName: string;
  industry?: string;
  companySize?: string;
  website?: string;
}): Promise<{
  competitors: Array<{
    name: string;
    website?: string;
    description?: string;
    strengths?: string[];
    weaknesses?: string[];
    pricing?: string;
    marketPosition?: string;
    differentiators?: string[];
  }>;
  competitiveAnalysis?: string;
  ourAdvantages?: string[];
  battleCard?: string;
}> {
  // Use dedicated Relevance AI tool if configured
  if (COMPETITOR_TOOL_ID) {
    const result = await triggerRelevanceTool(COMPETITOR_TOOL_ID, {
      company_name: params.companyName,
      industry: params.industry || "",
      company_size: params.companySize || "",
      website: params.website || "",
    });

    const parsed = parseNestedJson(result);
    return {
      competitors: parsed.competitors || [],
      competitiveAnalysis: parsed.competitive_analysis || parsed.analysis,
      ourAdvantages: parsed.our_advantages || [],
      battleCard: parsed.battle_card,
    };
  }

  // Fallback: GPT-4o-mini competitor analysis
  if (!process.env.OPENAI_API_KEY) {
    return { competitors: [], competitiveAnalysis: "No competitor tool configured", ourAdvantages: [] };
  }

  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `Analyze the competitive landscape for a company with these characteristics:

Company: ${params.companyName}
Industry: ${params.industry || "Unknown"}
Company Size: ${params.companySize || "Unknown"}
Website: ${params.website || "Unknown"}

Provide a competitive analysis in JSON format with:
1. "competitors": Array of top 3-5 likely competitors they might be evaluating, each with:
   - name
   - description (1 sentence)
   - strengths (array of 2-3)
   - weaknesses (array of 2-3)
   - pricing (if known, or "Unknown")
   - marketPosition (leader/challenger/niche)

2. "competitiveAnalysis": A brief paragraph about the competitive landscape

3. "ourAdvantages": Array of 3-5 potential advantages an AI automation agency would have when competing for this company's business

4. "battleCard": A brief sales battle card with key talking points against top competitors

Return ONLY valid JSON, no markdown or explanation.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a competitive intelligence analyst. Return only valid JSON." },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content || "{}";

  try {
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse competitor analysis:", e);
    return {
      competitors: [],
      competitiveAnalysis: "Unable to generate competitive analysis",
      ourAdvantages: [],
    };
  }
}

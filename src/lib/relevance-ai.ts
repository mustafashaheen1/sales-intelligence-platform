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

export async function generateOutreachStrategy(params: {
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

export async function researchCompetitors({
  companyName,
  industry,
  companySize,
  knownCompetitors,
}: {
  companyName: string;
  industry?: string;
  companySize?: string;
  knownCompetitors?: string;
}): Promise<any> {
  if (!COMPETITOR_TOOL_ID) {
    // Fallback: GPT-4o-mini competitor analysis
    if (!process.env.OPENAI_API_KEY) {
      return { competitors: [] };
    }

    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Analyze the competitive landscape for a company:
Company: ${companyName}
Industry: ${industry || "Unknown"}
Company Size: ${companySize || "Unknown"}

Return JSON with: "competitors" (array of {name, description, strengths[], weaknesses[], pricing, marketPosition}), "competitiveAnalysis" (string), "ourAdvantages" (string[]). Return ONLY valid JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a competitive intelligence analyst. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    try {
      return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch {
      return { competitors: [] };
    }
  }

  console.log("=== STARTING COMPETITOR RESEARCH ===");
  console.log("Calling Relevance AI Competitor Research, tool:", COMPETITOR_TOOL_ID);
  console.log("Company:", companyName, "Industry:", industry);

  try {
    const response = await fetch(
      `https://api-${process.env.RELEVANCE_AI_REGION}.stack.tryrelevance.com/latest/studios/${COMPETITOR_TOOL_ID}/trigger_limited`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${process.env.RELEVANCE_AI_PROJECT_ID}:${process.env.RELEVANCE_AI_API_KEY}`,
        },
        body: JSON.stringify({
          project: process.env.RELEVANCE_AI_PROJECT_ID,
          params: {
            company_name: companyName,
            industry: industry || "",
            company_size: companySize || "",
            known_competitors: knownCompetitors || "",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Relevance AI Competitor error:", response.status, errorText);
      return { competitors: [] };
    }

    const data = await response.json();
    console.log("Raw competitor response:", JSON.stringify(data, null, 2));

    // Step 1: get the output object
    let result = data.output || data;

    // Step 2: unwrap analyze_competitors_answer (Relevance AI tool key)
    if (result.analyze_competitors_answer) {
      let nested = result.analyze_competitors_answer;
      if (typeof nested === "string") {
        nested = nested.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
        try {
          result = JSON.parse(nested);
          console.log("Successfully parsed nested competitor JSON");
        } catch (parseError) {
          console.error("Failed to parse nested competitor JSON:", parseError);
          console.log("Raw nested string (first 500 chars):", nested.substring(0, 500));
          return { competitors: [] };
        }
      } else {
        result = nested;
      }
    }

    // Step 3: also handle answer key (alternate response format)
    if (result.answer && typeof result.answer === "string") {
      try {
        result = JSON.parse(
          result.answer.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim()
        );
      } catch {
        // keep result as-is
      }
    }

    if (!result.competitors || !Array.isArray(result.competitors)) {
      console.error("No competitors array in parsed result. Keys:", Object.keys(result));
      return { competitors: [] };
    }

    console.log("Competitor research complete:", result.competitors.length, "competitors found");
    return result;
  } catch (error) {
    console.error("Competitor research error:", error);
    return { competitors: [] };
  }
}

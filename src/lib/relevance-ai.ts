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
        company: lead.company || "",
        email: lead.email || "",
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

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AIScoreResult, Lead, OutreachType, OutreachTone, OutreachResult } from "@/types";
import { getScoreLabel } from "./utils";

function getModel() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }
  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.3,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

export async function scoreLead(lead: Partial<Lead>): Promise<AIScoreResult> {
  const model = getModel();

  const systemPrompt = `You are an expert B2B sales lead scoring assistant. Analyze the provided lead information and return a JSON object with the following fields:
- score: number between 0-100
- insights: 2-3 sentence analysis of the lead quality
- keyStrengths: array of 2-4 specific strengths
- concerns: array of 0-3 specific concerns
- suggestedNextStep: one specific actionable recommendation

Scoring criteria (weight each appropriately):
1. Title/Seniority: C-suite/VP (30pts), Director (20pts), Manager (10pts), Individual (5pts)
2. Company: Enterprise 500+ (25pts), Mid-market (15pts), Small business (10pts), No company/Freelance (2pts)
3. Lead Source: Referral (20pts), Event (15pts), LinkedIn (12pts), Website (10pts), Cold Outreach (5pts)
4. Email Domain: Corporate (15pts), Personal/Gmail etc (3pts)
5. Profile Completeness: Full profile (10pts), Partial (5pts), Minimal (2pts)

Return ONLY valid JSON, no other text.`;

  const leadInfo = `Lead Information:
- Name: ${lead.name || "Unknown"}
- Email: ${lead.email || "Unknown"}
- Company: ${lead.company || "Not provided"}
- Title: ${lead.title || "Not provided"}
- Phone: ${lead.phone || "Not provided"}
- LinkedIn: ${lead.linkedinUrl || "Not provided"}
- Lead Source: ${lead.leadSource || "Not provided"}
- Notes: ${lead.notes || "None"}`;

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(leadInfo),
  ]);

  const content = typeof response.content === "string" ? response.content : "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  const result = JSON.parse(jsonMatch[0]);
  const score = Math.min(100, Math.max(0, Number(result.score)));

  // Strip leading/trailing quotes that LLMs sometimes wrap around string values
  const cleanString = (val: unknown): string =>
    typeof val === "string" ? val.replace(/^["']+|["']+$/g, "").trim() : String(val ?? "");

  return {
    score,
    scoreLabel: getScoreLabel(score),
    insights: cleanString(result.insights),
    keyStrengths: Array.isArray(result.keyStrengths)
      ? result.keyStrengths.map(cleanString)
      : [],
    concerns: Array.isArray(result.concerns)
      ? result.concerns.map(cleanString)
      : [],
    suggestedNextStep: cleanString(result.suggestedNextStep) || "Follow up with more information",
  };
}

export async function generateOutreach(
  lead: Lead,
  type: OutreachType,
  tone: OutreachTone
): Promise<OutreachResult> {
  const model = getModel();

  const lengthLimits: Record<OutreachType, number> = {
    email: 500,
    linkedin: 300,
    sms: 160,
  };

  const toneDescriptions: Record<OutreachTone, string> = {
    professional: "formal, business-appropriate, and authoritative",
    casual: "relaxed, conversational, and approachable",
    friendly: "warm, personable, and enthusiastic",
  };

  const typeInstructions: Record<OutreachType, string> = {
    email: `Write a personalized sales email. Include a subject line on the first line prefixed with "Subject: ". The email should have a greeting, body, and sign-off.`,
    linkedin: `Write a LinkedIn connection request message or InMail. Keep it concise and networking-focused. No subject line needed.`,
    sms: `Write a brief, impactful SMS message. Must be under 160 characters. No greeting/sign-off needed, just the core message.`,
  };

  const systemPrompt = `You are an expert sales copywriter. Generate a ${type} message for a sales outreach.

${typeInstructions[type]}

Tone: ${toneDescriptions[tone]}
Maximum length: ${lengthLimits[type]} characters (for the body, excluding subject line)

Personalize the message based on the lead's information. Reference their role, company, or any relevant details. Make it feel genuine, not templated.

If the lead has AI insights, use them to inform the message angle.`;

  const leadContext = `Lead Information:
- Name: ${lead.name}
- Company: ${lead.company || "Unknown"}
- Title: ${lead.title || "Unknown"}
- Lead Source: ${lead.leadSource || "Unknown"}
- AI Insights: ${lead.aiInsights || "No insights available"}
- Key Strengths: ${lead.keyStrengths?.join(", ") || "Unknown"}
- Suggested Next Step: ${lead.suggestedNextStep || "General follow-up"}`;

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(leadContext),
  ]);

  const content = typeof response.content === "string" ? response.content : "";

  let subject: string | undefined;
  let message = content;

  if (type === "email") {
    const subjectMatch = content.match(/^Subject:\s*(.+)/m);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      message = content.replace(/^Subject:\s*.+\n*/m, "").trim();
    }
  }

  return {
    message,
    subject,
    type,
    tone,
  };
}

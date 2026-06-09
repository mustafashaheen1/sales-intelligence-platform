import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import OpenAI from "openai";
import { AIScoreResult, Lead, OutreachType, OutreachTone, OutreachResult } from "@/types";
import { getScoreLabel } from "./utils";

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API key not configured");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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

  return {
    score,
    scoreLabel: getScoreLabel(score),
    insights: typeof result.insights === "string" ? result.insights : "",
    keyStrengths: Array.isArray(result.keyStrengths) ? result.keyStrengths : [],
    concerns: Array.isArray(result.concerns) ? result.concerns : [],
    suggestedNextStep: result.suggestedNextStep || "Follow up with more information",
  };
}

export async function scoreLeadWithCallData(
  lead: Partial<Lead>,
  callData: {
    qualification_status?: string;
    pain_points?: string;
    budget_range?: string;
    timeline?: string;
    is_decision_maker?: boolean;
    call_summary?: string;
    call_outcome?: string;
    next_steps?: string;
  }
): Promise<AIScoreResult & { followUpTiming: string }> {
  const qualStatus = callData.qualification_status || callData.call_outcome || "";
  const wasNoAnswer = ["no-answer", "no_answer", "NO_ANSWER", "voicemail"].includes(qualStatus);

  // No new signal from unanswered calls — preserve current score
  if (wasNoAnswer && lead.aiScore !== undefined) {
    return {
      score: lead.aiScore,
      scoreLabel: getScoreLabel(lead.aiScore),
      insights: lead.aiInsights || "Call was not answered.",
      keyStrengths: lead.keyStrengths || [],
      concerns: lead.concerns || [],
      suggestedNextStep: lead.suggestedNextStep || "Retry call in 2-3 days",
      followUpTiming: "In 2 days",
    };
  }

  const openai = getOpenAI();

  const prompt = `You are a lead scoring AI. Re-evaluate this lead based on a recent phone call. The score can go UP or DOWN based on what happened.

LEAD INFO:
- Name: ${lead.name || "Unknown"}
- Company: ${lead.company || "Unknown"}
- Title: ${lead.title || "Unknown"}
- Previous Score: ${lead.aiScore ?? "Unknown"}
- Previous Label: ${lead.aiScoreLabel || "Unknown"}

CALL RESULTS:
- Call Summary: ${callData.call_summary || "No summary provided"}
- Call Outcome: ${qualStatus || "Unknown"}
- Pain Points Mentioned: ${callData.pain_points || "None identified"}
- Budget Range: ${callData.budget_range || "Not discussed"}
- Timeline: ${callData.timeline || "Not discussed"}
- Is Decision Maker: ${callData.is_decision_maker !== undefined ? (callData.is_decision_maker ? "Yes" : "No") : "Unknown"}
- Next Steps Agreed: ${callData.next_steps || "None"}

RE-SCORE THIS LEAD based on what happened in the call. Score can go UP or DOWN.

INCREASE SCORE if:
- They expressed clear interest → +20 to +40 points
- They mentioned specific pain points we can solve → +15 points
- They have budget allocated → +15 points
- They have a clear timeline (1-3 months) → +10 points
- They are the decision maker → +10 points
- They asked about pricing or features → +10 points
- They agreed to a follow-up meeting → +20 points

DECREASE SCORE if:
- They said "not interested" or similar → -30 to -50 points
- No pain points, "everything is fine" → -20 points
- No budget → -15 points
- No timeline or "maybe next year" → -10 points
- Not decision maker and won't connect us → -10 points
- Dismissive, one-word answers → -15 points
- Asked not to be contacted again → Set score to 5

KEEP SCORE SIMILAR if:
- Very short call, no real conversation
- Vague interest, no specifics

FINAL SCORE RANGES:
- 70-100: Hot 🔥 (clearly interested, BANT criteria met)
- 40-69: Warm 🌡️ (some interest, missing BANT criteria)
- 10-39: Cold ❄️ (not interested, no urgency, poor fit)
- 0-9: Do Not Contact (explicitly asked not to be contacted)

Return your response as a JSON object with these fields:
- score: number (0-100)
- scoreLabel: string ("Hot 🔥", "Warm 🌡️", "Cold ❄️", or "Do Not Contact")
- insights: string (2-3 sentence analysis)
- keyStrengths: array of strings
- concerns: array of strings
- suggestedNextStep: string
- followUpTiming: string (e.g. "In 2 days", "In 1 week", "In 1 month", "Do not follow up")`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(response.choices[0].message.content || "{}");
  const score = Math.min(100, Math.max(0, Number(parsed.score)));

  return {
    score,
    scoreLabel: getScoreLabel(score),
    insights: typeof parsed.insights === "string" ? parsed.insights : "",
    keyStrengths: Array.isArray(parsed.keyStrengths) ? parsed.keyStrengths : [],
    concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
    suggestedNextStep: parsed.suggestedNextStep || "Follow up based on call outcome",
    followUpTiming: parsed.followUpTiming || "In 1 week",
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

  // Build call context from structured Vapi data or summary
  let callContext = "";
  if (lead.vapiCallData) {
    try {
      const callData = JSON.parse(lead.vapiCallData);
      callContext = `
CALL RESULTS (Use this to personalize!):
- Qualification Status: ${callData.qualification_status || "Unknown"}
- Pain Points Discussed: ${callData.pain_points || "None captured"}
- Budget Range: ${callData.budget_range || "Not discussed"}
- Timeline: ${callData.timeline || "Not discussed"}
- Is Decision Maker: ${callData.is_decision_maker ?? "Unknown"}
- Call Summary: ${callData.call_summary || "No summary"}
- Next Steps Agreed: ${callData.next_steps || "None"}`;
    } catch {}
  } else if (lead.vapiCallSummary) {
    callContext = `\nCALL SUMMARY: ${lead.vapiCallSummary}`;
  }

  // Build enrichment context
  let enrichmentContext = "";
  if (lead.enrichmentData) {
    try {
      const enrichRaw = JSON.parse(lead.enrichmentData);
      const enrichData = enrichRaw.answer
        ? (typeof enrichRaw.answer === "string"
            ? JSON.parse(enrichRaw.answer.replace(/^```json\s*|```$/gi, "").trim())
            : enrichRaw.answer)
        : enrichRaw;
      const painPoints = Array.isArray(enrichData.likely_pain_points) ? enrichData.likely_pain_points.join(", ") : "";
      const aiOpps = Array.isArray(enrichData.ai_automation_opportunities) ? enrichData.ai_automation_opportunities.join(", ") : "";
      enrichmentContext = `
ENRICHMENT INSIGHTS:
- Industry: ${enrichData.industry || "Unknown"}
- Company Size: ${enrichData.estimated_company_size || "Unknown"}
- Seniority Level: ${enrichData.seniority_level || "Unknown"}
- Pain Points: ${painPoints || "Unknown"}
- AI Opportunities: ${aiOpps || "Unknown"}
- ICP Fit Score: ${enrichData.icp_fit_score ?? "Unknown"}/100`;
    } catch {}
  }

  const systemPrompt = `You are an expert sales copywriter. Generate a ${type} message for a sales outreach.

${typeInstructions[type]}

Tone: ${toneDescriptions[tone]}
Maximum length: ${lengthLimits[type]} characters (for the body, excluding subject line)

IMPORTANT: If call data is provided, reference specific pain points or discussions from the call to make the message highly personalized. If enrichment data is available, use industry-specific language and address their specific challenges. Make it feel genuine, not templated.`;

  const leadContext = `LEAD INFORMATION:
- Name: ${lead.name}
- Company: ${lead.company || "Unknown"}
- Title: ${lead.title || "Unknown"}
- Lead Source: ${lead.leadSource || "Unknown"}
- AI Insights: ${lead.aiInsights || "No insights available"}
- Key Strengths: ${lead.keyStrengths?.join(", ") || "Unknown"}
- Suggested Next Step: ${lead.suggestedNextStep || "General follow-up"}
${callContext}
${enrichmentContext}`;

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

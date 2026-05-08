import { Lead, Company, CallHistoryEntry } from "@/types";

interface OutreachData {
  discoveryQuestions: string[];
  objectionHandling: Array<{ objection: string; response: string }>;
  valuePropositions: string[];
  personalizationHooks: string[];
  bestTimeToReach?: string;
}

interface CallContext {
  isFollowUp: boolean;
  callNumber: number;
  previousCallSummary?: string;
  previousCallDate?: string;
  callHistory?: CallHistoryEntry[];
  qualification?: {
    budget?: string;
    authority?: string;
    need?: string;
    timeline?: string;
  };
  enrichmentData?: {
    painPoints: string[];
    aiOpportunities: string[];
    industry?: string;
    companySize?: string;
    estimatedRevenue?: string;
    icpFitScore?: number;
    seniorityLevel?: string;
    recommendedApproach?: string;
    talkingPoints?: string[];
  };
  outreachData?: OutreachData;
  competitorInfo?: {
    competitors: Array<{ name: string; strengths?: string[]; weaknesses?: string[] }>;
    ourAdvantages: string[];
  };
  companyOverview?: string;
  availableSlots?: string;
  schedulingLink?: string;
}

// Parse the nested JSON wrapper Relevance AI wraps responses in
function parseNestedJson(raw: any): any {
  if (!raw) return null;
  try {
    const outer = typeof raw === "string" ? JSON.parse(raw) : raw;
    const inner = outer.answer ?? outer.output?.answer ?? outer.output ?? outer;
    if (typeof inner === "string") {
      return JSON.parse(inner.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
    }
    return inner;
  } catch {
    return null;
  }
}

function parseObjectionHandling(
  raw: any
): Array<{ objection: string; response: string }> {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter((o: any) => o && (o.objection || o.response))
      .map((o: any) => ({ objection: o.objection || "", response: o.response || "" }));
  }
  if (typeof raw === "object") {
    return Object.entries(raw).map(([objection, response]) => ({
      objection,
      response: String(response),
    }));
  }
  return [];
}

export function buildCallContext(
  lead: Lead,
  company?: Company | null,
  availableSlotsFormatted?: string,
  schedulingLink?: string
): CallContext {
  const context: CallContext = {
    isFollowUp: (lead.callCount || 0) > 0,
    callNumber: (lead.callCount || 0) + 1,
  };

  // Previous call info
  if (lead.lastCallSummary) {
    context.previousCallSummary = lead.lastCallSummary;
    context.previousCallDate = lead.lastCallDate;
  }

  // Full call history
  if (lead.callHistory) {
    try {
      const history =
        typeof lead.callHistory === "string" ? JSON.parse(lead.callHistory) : lead.callHistory;
      if (Array.isArray(history) && history.length > 0) {
        context.callHistory = history;
      }
    } catch {
      // ignore
    }
  }

  // Qualification from last call data
  if (lead.vapiCallData) {
    try {
      const callData =
        typeof lead.vapiCallData === "string"
          ? JSON.parse(lead.vapiCallData)
          : lead.vapiCallData;
      context.qualification = {
        budget: callData.budget_range || callData.budget_qualification,
        authority: callData.decision_maker || String(callData.is_decision_maker ?? ""),
        need: callData.pain_points || callData.needs_identified,
        timeline: callData.timeline,
      };
    } catch {
      // ignore
    }
  }

  // Enrichment data — handle Relevance AI nested answer wrapper
  if (lead.enrichmentData) {
    const enrichment = parseNestedJson(lead.enrichmentData);
    if (enrichment) {
      context.enrichmentData = {
        painPoints: enrichment.likely_pain_points || enrichment.pain_points || [],
        aiOpportunities: enrichment.ai_automation_opportunities || enrichment.ai_opportunities || [],
        industry: enrichment.industry || lead.industry,
        companySize: enrichment.estimated_company_size || enrichment.company_size || lead.companySize,
        estimatedRevenue: enrichment.estimated_revenue,
        icpFitScore: enrichment.icp_fit_score,
        seniorityLevel: enrichment.seniority_level,
        recommendedApproach: enrichment.recommended_approach,
        talkingPoints: enrichment.talking_points || [],
      };
    }
  }

  // Outreach strategy — handle both post-call format and Relevance AI format
  if (lead.outreachStrategy) {
    const outreach = parseNestedJson(lead.outreachStrategy);
    if (outreach) {
      context.outreachData = {
        discoveryQuestions: Array.isArray(outreach.discovery_questions)
          ? outreach.discovery_questions
          : [],
        objectionHandling: parseObjectionHandling(outreach.objection_handling),
        valuePropositions: Array.isArray(outreach.value_propositions)
          ? outreach.value_propositions
          : [],
        personalizationHooks: Array.isArray(outreach.personalization_hooks)
          ? outreach.personalization_hooks
          : [],
        bestTimeToReach: outreach.best_time_to_reach,
      };
    }
  }

  // Company research
  if (company?.companyResearch) {
    const research = parseNestedJson(company.companyResearch);
    if (research?.company_overview) {
      context.companyOverview = research.company_overview;
    }
  }

  // Competitor info
  if (lead.competitorInfo) {
    try {
      const competitors =
        typeof lead.competitorInfo === "string"
          ? JSON.parse(lead.competitorInfo)
          : lead.competitorInfo;
      if (Array.isArray(competitors)) {
        context.competitorInfo = {
          competitors: competitors.map((c: any) => ({
            name: c.name,
            strengths: c.strengths || [],
            weaknesses: c.weaknesses || [],
          })),
          ourAdvantages: competitors.flatMap((c: any) => c.weaknesses || []).slice(0, 4),
        };
      }
    } catch {
      // ignore
    }
  }

  // Calendly slots
  if (availableSlotsFormatted) {
    context.availableSlots = availableSlotsFormatted;
    context.schedulingLink = schedulingLink;
  }

  return context;
}

export function buildFirstMessage(lead: Lead, context: CallContext): string {
  if (context.callHistory && context.callHistory.length > 0) {
    return `Hi ${lead.name}, this is Sarah from Coder Crew following up from our conversation. Do you have a few minutes?`;
  }
  if (lead.company) {
    return `Hi, is this ${lead.name} from ${lead.company}?`;
  }
  return `Hi, is this ${lead.name}?`;
}

export function generateCallScript(lead: Lead, context: CallContext): string {
  return buildFirstMessage(lead, context);
}

export function generateSystemPrompt(lead: Lead, context: CallContext): string {
  const industry = context.enrichmentData?.industry || lead.industry || "your industry";
  const companySize = context.enrichmentData?.companySize || lead.companySize || "";
  const painPoints = context.enrichmentData?.painPoints || [];
  const aiOpportunities = context.enrichmentData?.aiOpportunities || [];
  const discoveryQuestions = context.outreachData?.discoveryQuestions || [];
  const objectionHandling = context.outreachData?.objectionHandling || [];
  const valuePropositions = context.outreachData?.valuePropositions || [];
  const personalizationHooks = context.outreachData?.personalizationHooks || [];

  const lastCall = context.callHistory?.[context.callHistory.length - 1];

  let prompt = `You are Sarah, a friendly Sales Development Representative from Coder Crew, an AI solutions agency. Your job is to have a brief, genuine conversation to understand if Coder Crew can help this prospect.

## Your Personality
- Warm, professional, and conversational — never robotic or pushy
- Genuinely curious about their challenges
- Respectful of their time — keep the call under 4 minutes

## Lead Information
- Name: ${lead.name}
- Company: ${lead.company || "Unknown"}
- Title: ${lead.title || "Unknown"}
- Industry: ${industry}${companySize ? `\n- Company Size: ${companySize}` : ""}${context.enrichmentData?.seniorityLevel ? `\n- Seniority: ${context.enrichmentData.seniorityLevel}` : ""}${context.enrichmentData?.estimatedRevenue ? `\n- Estimated Revenue: ${context.enrichmentData.estimatedRevenue}` : ""}${lead.notes ? `\n- Notes: ${lead.notes}` : ""}
`;

  // Previous call history
  if (context.isFollowUp && lastCall) {
    prompt += `
## Previous Call History
This is a FOLLOW-UP call. You have spoken with ${lead.name} before.
- Number of previous calls: ${context.callHistory?.length || 1}
- Last call outcome: ${lastCall.outcome || "Unknown"}
- Last call summary: ${lastCall.summary || context.previousCallSummary || "No summary"}${(lastCall as any).painPoints ? `\n- Pain points they mentioned: ${(lastCall as any).painPoints}` : ""}${(lastCall as any).nextSteps ? `\n- Previously agreed next steps: ${(lastCall as any).nextSteps}` : ""}

IMPORTANT: Open by referencing the previous conversation naturally. For example:
"Hi ${lead.name.split(" ")[0]}, this is Sarah following up from our conversation — do you have a few minutes?"
`;
  }

  // Company intelligence
  if (context.companyOverview) {
    prompt += `
## Company Intelligence
${context.companyOverview}
`;
  }

  // Pain points
  if (painPoints.length > 0) {
    prompt += `
## Known Pain Points (Reference These!)
${painPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}
`;
  }

  // AI opportunities
  if (aiOpportunities.length > 0) {
    prompt += `
## AI/Automation Opportunities for This Company
${aiOpportunities.map((o, i) => `${i + 1}. ${o}`).join("\n")}
`;
  }

  // Personalization hooks
  if (personalizationHooks.length > 0) {
    prompt += `
## Personalization Hooks (Mention Naturally)
${personalizationHooks.map((h) => `- ${h}`).join("\n")}
`;
  }

  // Value propositions
  if (valuePropositions.length > 0) {
    prompt += `
## Value Propositions (When Relevant)
${valuePropositions.map((v) => `- ${v}`).join("\n")}
`;
  }

  // Discovery questions
  const defaultDiscovery = [
    `What are the current challenges you face in ${industry}?`,
    "Are there repetitive tasks that take up too much of your team's time?",
    "Have you explored AI or automation solutions before?",
    "What would success look like if you could automate some of your processes?",
    "Who else would be involved in evaluating a solution like this?",
  ];
  const questions = discoveryQuestions.length > 0 ? discoveryQuestions.slice(0, 5) : defaultDiscovery;

  prompt += `
## Discovery Questions (Ask 2-3 Naturally — Not as a Checklist)
${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}
`;

  // Objection handling
  const defaultObjections = [
    { objection: "not interested", response: "I completely understand. Could I ask what specifically isn't a fit? That helps me know whether to follow up later." },
    { objection: "no budget", response: "Makes sense. We work with companies at different stages. When would budget discussions typically happen for you?" },
    { objection: "bad timing", response: "Timing is everything. When would be a better time — next quarter, or end of year?" },
    { objection: "already have a solution", response: "Good to know. What are you using? I'd love to hear if there are any gaps we could fill." },
  ];
  const objections = objectionHandling.length > 0 ? objectionHandling : defaultObjections;

  prompt += `
## Objection Handling
${objections.map((o) => `If they say "${o.objection}": ${o.response}`).join("\n")}
`;

  // Competitor awareness
  if (context.competitorInfo?.competitors?.length) {
    prompt += `
## Competitor Awareness
They may be evaluating: ${context.competitorInfo.competitors.map((c) => c.name).join(", ")}
Our advantages: ${context.competitorInfo.ourAdvantages.join(", ")}
`;
  }

  // Qualification + BANT
  if (context.qualification && context.isFollowUp) {
    prompt += `
## Known BANT from Previous Calls
${context.qualification.budget ? `- Budget: ${context.qualification.budget}` : ""}
${context.qualification.authority ? `- Authority/Decision Maker: ${context.qualification.authority}` : ""}
${context.qualification.need ? `- Their Need: ${context.qualification.need}` : ""}
${context.qualification.timeline ? `- Timeline: ${context.qualification.timeline}` : ""}
`.replace(/\n\n/g, "\n");
  }

  // Calendly scheduling
  if (context.availableSlots) {
    prompt += `
## Meeting Scheduling
If they're interested, offer to schedule a follow-up meeting. Available times:
${context.availableSlots}
Confirm the exact date and time clearly when they agree.
`;
  }

  // Call flow
  const firstName = lead.name.split(" ")[0];
  const hookLine = personalizationHooks.length > 0
    ? personalizationHooks[0]
    : `companies like ${lead.company || "yours"} are growing quickly`;

  prompt += `
## Call Flow

### 1. Introduction
${context.isFollowUp
  ? `Your first message already opened with a follow-up greeting. Continue naturally from there.`
  : `Your first message ONLY asked "Hi, is this ${lead.name}${lead.company ? ` from ${lead.company}` : ""}?" — you have NOT introduced yourself yet.

WAIT for them to respond. Then based on their response:

If they CONFIRM (say "yes", "speaking", "this is [name]", etc.):
"Great! This is Sarah from Coder Crew. We help companies like ${lead.company || "yours"} automate their workflows with AI. I noticed ${hookLine} — and I wanted to have a quick 3-minute chat to see if we might be able to help. Is now an okay time?"

If they say WRONG NUMBER or are confused:
"I apologize for the confusion! Have a great day!"

If they ask WHO'S CALLING before confirming:
"This is Sarah from Coder Crew. Am I speaking with ${lead.name}?"`
}

### 2. Discovery (2 minutes)
Use the discovery questions above, but ask them naturally based on the conversation flow.${painPoints.length > 0 ? `\nYou know they likely struggle with: "${painPoints[0]}" — reference it if it fits.` : ""}
If they say they're busy: "No problem at all — when would be a better time to reach you?"

### 3. BANT Qualification (30 seconds)
- "If we found a solution that could help, what would your timeline look like?"
- "Do you have a budget range in mind for a project like this?"
- "Besides yourself, who else would be involved in the decision?"

### 4. Close (30 seconds)
If qualified: "This sounds like something we could definitely help with. Would you be open to a 30-minute call with one of our AI specialists? I can send over some available times."
If not qualified: "Thanks so much for your time. It doesn't sound like the right fit right now, but I'll send over some resources that might be helpful."

## Qualification Criteria
Mark QUALIFIED if: clear pain point we can solve + budget authority + timeline within 6 months
Mark NOT_QUALIFIED if: no clear need for AI/automation, no budget path, timeline over 12 months

## Rules
- Keep the call under 4 minutes
- If they confirm their identity, ALWAYS introduce yourself before doing anything else
- Thank them regardless of outcome
- After saying your closing line (goodbye / thank you for your time), end the call immediately
`;

  return prompt;
}

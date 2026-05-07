import { Lead, Company, CallHistoryEntry } from "@/types";

interface CallContext {
  isFollowUp: boolean;
  callNumber: number;
  previousCallSummary?: string;
  previousCallDate?: string;
  qualification?: {
    budget?: string;
    authority?: string;
    need?: string;
    timeline?: string;
  };
  enrichmentData?: {
    painPoints: string[];
    industry?: string;
    companySize?: string;
    icpFitScore?: number;
    recommendedTone?: string;
    discoveryQuestions?: string[];
    talkingPoints?: string[];
  };
  competitorInfo?: {
    competitors: string[];
    ourAdvantages: string[];
  };
  availableSlots?: string;
  schedulingLink?: string;
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

  // Parse call history for qualification data
  if (lead.vapiCallData) {
    try {
      const callData =
        typeof lead.vapiCallData === "string"
          ? JSON.parse(lead.vapiCallData)
          : lead.vapiCallData;
      context.qualification = {
        budget: callData.budget_qualification,
        authority: callData.decision_maker,
        need: callData.needs_identified,
        timeline: callData.timeline,
      };
    } catch (e) {
      console.error("Failed to parse call data:", e);
    }
  }

  // Enrichment data
  if (lead.enrichmentData) {
    try {
      const enrichment =
        typeof lead.enrichmentData === "string"
          ? JSON.parse(lead.enrichmentData)
          : lead.enrichmentData;
      context.enrichmentData = {
        painPoints: enrichment.likely_pain_points || enrichment.pain_points || [],
        industry: enrichment.industry || lead.industry,
        companySize: enrichment.estimated_company_size || lead.companySize,
        icpFitScore: enrichment.icp_fit_score,
        recommendedTone: enrichment.recommended_approach,
        discoveryQuestions: enrichment.discovery_questions || [],
        talkingPoints: enrichment.talking_points || [],
      };
    } catch (e) {
      console.error("Failed to parse enrichment data:", e);
    }
  }

  // Competitor info
  if (lead.competitorInfo) {
    try {
      const competitors =
        typeof lead.competitorInfo === "string"
          ? JSON.parse(lead.competitorInfo)
          : lead.competitorInfo;
      context.competitorInfo = {
        competitors: competitors.map((c: any) => c.name),
        ourAdvantages: competitors.flatMap((c: any) => c.weaknesses || []),
      };
    } catch (e) {
      console.error("Failed to parse competitor info:", e);
    }
  }

  // Calendly slots
  if (availableSlotsFormatted) {
    context.availableSlots = availableSlotsFormatted;
    context.schedulingLink = schedulingLink;
  }

  return context;
}

export function generateCallScript(lead: Lead, context: CallContext): string {
  if (context.callNumber === 0) {
    return generateInboundScript(lead, context);
  }

  if (!context.isFollowUp) {
    return generateFirstCallScript(lead, context);
  }

  return generateFollowUpScript(lead, context);
}

function generateInboundScript(lead: Lead, context: CallContext): string {
  let script = `Thanks for calling! This is Sarah from the sales team.`;

  if (lead.name && lead.name !== "Unknown") {
    script = `Hi ${lead.name.split(" ")[0]}, thanks for calling back! This is Sarah.`;

    if (context.previousCallSummary) {
      script += ` Great to hear from you again. Last time we spoke about ${summarizeForScript(context.previousCallSummary)}.`;
    }
  } else {
    script += ` How can I help you today?`;
  }

  return script;
}

function generateFirstCallScript(lead: Lead, context: CallContext): string {
  let script = `Hi, this is Sarah from the sales team. Am I speaking with ${lead.name}`;

  if (lead.company) {
    script += ` from ${lead.company}`;
  }
  script += `?`;

  if (context.enrichmentData?.painPoints?.length) {
    const painPoint = context.enrichmentData.painPoints[0];
    script += ` I noticed companies in the ${context.enrichmentData.industry || "your"} industry often face challenges with ${painPoint}. I wanted to reach out because we've been helping similar companies solve exactly that.`;
  }

  return script;
}

function generateFollowUpScript(lead: Lead, context: CallContext): string {
  const firstName = lead.name.split(" ")[0];

  let script = `Hi ${firstName}, this is Sarah following up from our conversation`;

  if (context.previousCallDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(context.previousCallDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince === 0) {
      script += ` earlier today`;
    } else if (daysSince === 1) {
      script += ` yesterday`;
    } else if (daysSince < 7) {
      script += ` a few days ago`;
    } else {
      script += ` last week`;
    }
  }
  script += `.`;

  if (context.qualification?.need) {
    script += ` You mentioned you were looking for help with ${context.qualification.need}.`;
  } else if (context.previousCallSummary) {
    script += ` We discussed ${summarizeForScript(context.previousCallSummary)}.`;
  }

  if (context.qualification?.budget && context.qualification?.timeline) {
    script += ` I wanted to follow up on next steps for moving forward.`;
  } else {
    script += ` I wanted to check in and see if you had any questions.`;
  }

  return script;
}

function summarizeForScript(summary: string): string {
  const cleaned = summary.replace(/\n/g, " ").trim();
  if (cleaned.length > 100) {
    return cleaned.substring(0, 100).split(" ").slice(0, -1).join(" ") + "...";
  }
  return cleaned;
}

export function generateSystemPrompt(lead: Lead, context: CallContext): string {
  let prompt = `You are Sarah, a friendly and professional AI sales representative. You're calling ${lead.name}`;

  if (lead.company) {
    prompt += ` from ${lead.company}`;
  }
  prompt += `.\n\n`;

  // Call context
  if (context.isFollowUp) {
    prompt += `## Call Context\nThis is follow-up call #${context.callNumber}.\n`;
    if (context.previousCallSummary) {
      prompt += `Previous call summary: ${context.previousCallSummary}\n`;
    }
    if (context.qualification) {
      prompt += `\nWhat we know from previous calls:\n`;
      if (context.qualification.budget) prompt += `- Budget: ${context.qualification.budget}\n`;
      if (context.qualification.authority) prompt += `- Decision maker: ${context.qualification.authority}\n`;
      if (context.qualification.need) prompt += `- Their needs: ${context.qualification.need}\n`;
      if (context.qualification.timeline) prompt += `- Timeline: ${context.qualification.timeline}\n`;
    }
  } else {
    prompt += `## Call Context\nThis is the first call with this lead.\n`;
  }

  // Enrichment context
  if (context.enrichmentData) {
    prompt += `\n## Lead Intelligence\n`;
    if (context.enrichmentData.industry) {
      prompt += `- Industry: ${context.enrichmentData.industry}\n`;
    }
    if (context.enrichmentData.companySize) {
      prompt += `- Company size: ${context.enrichmentData.companySize}\n`;
    }
    if (context.enrichmentData.icpFitScore) {
      prompt += `- ICP fit score: ${context.enrichmentData.icpFitScore}/100\n`;
    }
    if (context.enrichmentData.painPoints?.length) {
      prompt += `- Known pain points: ${context.enrichmentData.painPoints.join(", ")}\n`;
    }
    if (context.enrichmentData.recommendedTone) {
      prompt += `\nRecommended approach: ${context.enrichmentData.recommendedTone}\n`;
    }
    if (context.enrichmentData.talkingPoints?.length) {
      prompt += `\nTalking points to use:\n`;
      context.enrichmentData.talkingPoints.forEach((tp) => {
        prompt += `- ${tp}\n`;
      });
    }
    if (context.enrichmentData.discoveryQuestions?.length) {
      prompt += `\nDiscovery questions to ask:\n`;
      context.enrichmentData.discoveryQuestions.slice(0, 5).forEach((q) => {
        prompt += `- ${q}\n`;
      });
    }
  }

  // Competitor context
  if (context.competitorInfo?.competitors?.length) {
    prompt += `\n## Competitive Context\n`;
    prompt += `They may be evaluating: ${context.competitorInfo.competitors.join(", ")}\n`;
    if (context.competitorInfo.ourAdvantages?.length) {
      prompt += `Our advantages over competitors: ${context.competitorInfo.ourAdvantages.join(", ")}\n`;
    }
  }

  // Meeting scheduling context
  if (context.availableSlots) {
    prompt += `\n## Meeting Scheduling\n`;
    prompt += `You can offer to schedule a meeting. Here are available times:\n`;
    prompt += context.availableSlots;
    prompt += `\n\nWhen the prospect agrees to a meeting time, confirm the exact date and time clearly.`;
  }

  // Goals
  prompt += `\n## Your Goals\n`;
  if (context.isFollowUp) {
    prompt += `1. Re-establish rapport by referencing previous conversation\n`;
    prompt += `2. Address any questions or concerns they have\n`;
    prompt += `3. Move toward scheduling a demo or next meeting\n`;
    prompt += `4. If they're ready, propose specific meeting times\n`;
  } else {
    prompt += `1. Confirm you're speaking with the right person\n`;
    prompt += `2. Understand their current challenges and needs\n`;
    prompt += `3. Qualify: budget, timeline, decision-making authority\n`;
    prompt += `4. If qualified, offer to schedule a follow-up meeting\n`;
  }

  prompt += `\n## Important Rules\n`;
  prompt += `- Be conversational and natural, not robotic\n`;
  prompt += `- Listen more than you talk\n`;
  prompt += `- Don't be pushy — if they're not interested, thank them and end politely\n`;
  prompt += `- If they ask about pricing, give ranges and offer to discuss specifics in a meeting\n`;
  prompt += `- Always confirm next steps before ending the call\n`;

  return prompt;
}

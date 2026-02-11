import { NextRequest, NextResponse } from "next/server";
import { getLead, updateLead } from "@/lib/airtable";
import { getDemoLeads } from "@/lib/demo-data";
import { scoreLead } from "@/lib/langchain";
import { getScoreLabel } from "@/lib/utils";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (isDemoMode()) {
      const lead = getDemoLeads().find((l) => l.id === params.id);
      if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

      // Simulate AI scoring in demo mode
      await new Promise((r) => setTimeout(r, 1500));
      const score = Math.floor(Math.random() * 50) + 40;
      return NextResponse.json({
        lead: {
          ...lead,
          aiScore: score,
          aiScoreLabel: getScoreLabel(score),
          aiInsights: `Re-scored: ${lead.name} shows ${score >= 70 ? "strong" : score >= 40 ? "moderate" : "limited"} potential based on updated analysis. ${lead.title ? `Their role as ${lead.title}` : "Their profile"} at ${lead.company || "their organization"} indicates ${score >= 70 ? "high buying authority" : "some influence in the buying process"}.`,
          keyStrengths: lead.keyStrengths || ["Profile data available"],
          concerns: lead.concerns || ["Needs further qualification"],
          suggestedNextStep: score >= 70 ? "Schedule a demo call this week" : "Send educational content and follow up in 5 days",
        },
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 400 });
    }

    const lead = await getLead(params.id);
    const scoreResult = await scoreLead(lead);

    const updatedLead = await updateLead(params.id, {
      aiScore: scoreResult.score,
      aiScoreLabel: scoreResult.scoreLabel,
      aiInsights: scoreResult.insights,
      keyStrengths: scoreResult.keyStrengths,
      concerns: scoreResult.concerns,
      suggestedNextStep: scoreResult.suggestedNextStep,
    });

    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    console.error("Error scoring lead:", error);
    return NextResponse.json({ error: "Failed to score lead" }, { status: 500 });
  }
}

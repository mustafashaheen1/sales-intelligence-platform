import { NextRequest, NextResponse } from "next/server";
import { getLead, updateLead } from "@/lib/airtable";
import { scoreLead } from "@/lib/langchain";
import { getScoreLabel } from "@/lib/utils";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

export async function POST(request: NextRequest) {
  try {
    const { leadIds } = await request.json();

    if (isDemoMode()) {
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({
        results: leadIds.map((id: string) => {
          const score = Math.floor(Math.random() * 60) + 30;
          return { id, score, scoreLabel: getScoreLabel(score), success: true };
        }),
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 400 });
    }

    const results = [];
    for (const id of leadIds) {
      try {
        const lead = await getLead(id);
        const scoreResult = await scoreLead(lead);
        await updateLead(id, {
          aiScore: scoreResult.score,
          aiScoreLabel: scoreResult.scoreLabel,
          aiInsights: scoreResult.insights,
          keyStrengths: scoreResult.keyStrengths,
          concerns: scoreResult.concerns,
          suggestedNextStep: scoreResult.suggestedNextStep,
        });
        results.push({ id, ...scoreResult, success: true });
      } catch (err) {
        results.push({ id, success: false, error: "Failed to score" });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: "Failed to bulk score" }, { status: 500 });
  }
}

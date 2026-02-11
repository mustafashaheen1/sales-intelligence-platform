import { NextRequest, NextResponse } from "next/server";
import { getLead } from "@/lib/airtable";
import { getDemoLeads } from "@/lib/demo-data";
import { generateOutreach } from "@/lib/langchain";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { type, tone } = await request.json();

    let lead;
    if (isDemoMode()) {
      lead = getDemoLeads().find((l) => l.id === params.id);
      if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

      // Demo mode: return sample outreach
      await new Promise((r) => setTimeout(r, 1000));
      const messages: Record<string, { subject?: string; message: string }> = {
        email: {
          subject: `Quick question about ${lead.company || "your"} workflow`,
          message: `Hi ${lead.name.split(" ")[0]},\n\nI noticed ${lead.company ? `${lead.company} is` : "you're"} in a great position to leverage AI automation for ${lead.title?.includes("Engineering") || lead.title?.includes("CTO") ? "your engineering workflows" : "your business processes"}.\n\n${lead.aiInsights ? "Based on my research, " + lead.suggestedNextStep?.toLowerCase() : "I'd love to share how our platform could help streamline your operations."}.\n\nWould you have 15 minutes this week for a quick chat?\n\nBest regards,\nSarah`,
        },
        linkedin: {
          message: `Hi ${lead.name.split(" ")[0]}, I came across your profile${lead.company ? ` and ${lead.company}'s work` : ""} - impressive! I'm working on AI-powered sales automation and think it could be valuable for ${lead.title ? `someone in a ${lead.title} role` : "your work"}. Would love to connect and share some insights. No pitch, just genuine conversation.`,
        },
        sms: {
          message: `Hi ${lead.name.split(" ")[0]}, Sarah from SalesAI here. Quick Q: is ${lead.company || "your team"} exploring AI automation? Happy to share a relevant case study.`,
        },
      };

      const msg = messages[type] || messages.email;
      return NextResponse.json({ ...msg, type, tone });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 400 });
    }

    lead = await getLead(params.id);
    const result = await generateOutreach(lead, type, tone);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating outreach:", error);
    return NextResponse.json({ error: "Failed to generate outreach" }, { status: 500 });
  }
}

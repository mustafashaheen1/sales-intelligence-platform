import { NextRequest, NextResponse } from "next/server";
import { getLeads } from "@/lib/airtable";
import { buildCallContext, generateCallScript, generateSystemPrompt } from "@/lib/call-context";
import { getCalendlyUser, getEventTypes, getAvailableSlots, formatSlotsForAI } from "@/lib/calendly";
import { normalizePhone } from "@/lib/utils";

// Configure this URL in your Vapi assistant's "Server URL" setting.
// Vapi calls this endpoint when an inbound call arrives to get dynamic assistant config.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messageType = body.message?.type || body.type;

    if (messageType === "assistant-request") {
      return handleAssistantRequest(body);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inbound call handler error:", error);
    return NextResponse.json({ error: "Failed to handle inbound call" }, { status: 500 });
  }
}

async function handleAssistantRequest(body: any) {
  const customerPhone = body.message?.call?.customer?.number || body.call?.customer?.number;

  let availableSlotsFormatted = "";
  let schedulingLink = "";

  if (process.env.CALENDLY_API_KEY) {
    try {
      const user = await getCalendlyUser();
      const eventTypes = await getEventTypes(user.uri);
      if (eventTypes.length > 0) {
        const startDate = new Date().toISOString().split("T")[0];
        const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        const slots = await getAvailableSlots(eventTypes[0].uri, startDate, endDate);
        availableSlotsFormatted = formatSlotsForAI(slots.filter((s) => s.available));
        schedulingLink = eventTypes[0].schedulingUrl;
      }
    } catch (e) {
      console.error("Failed to fetch Calendly slots:", e);
    }
  }

  if (!customerPhone) {
    return NextResponse.json({
      assistant: {
        firstMessage:
          "Thanks for calling! This is Sarah from the sales team. How can I help you today?",
        model: {
          messages: [{ role: "system", content: getUnknownCallerPrompt(availableSlotsFormatted) }],
        },
      },
    });
  }

  const normalizedPhone = normalizePhone(customerPhone);
  const { leads } = await getLeads({
    filterByFormula: `{Phone} = "${normalizedPhone}"`,
    maxRecords: 1,
  });

  const lead = leads[0] || null;

  if (lead) {
    const context = buildCallContext(lead, null, availableSlotsFormatted, schedulingLink);
    // callNumber 0 triggers the inbound greeting branch in generateCallScript
    const inboundContext = { ...context, callNumber: 0 };

    return NextResponse.json({
      assistant: {
        firstMessage: generateCallScript(lead, inboundContext),
        model: {
          messages: [
            { role: "system", content: generateSystemPrompt(lead, inboundContext) },
          ],
        },
        metadata: {
          leadId: lead.id,
          callType: "inbound",
          knownLead: true,
        },
      },
    });
  }

  // Unknown caller — capture their info during the call
  return NextResponse.json({
    assistant: {
      firstMessage:
        "Thanks for calling! This is Sarah from the sales team. How can I help you today?",
      model: {
        messages: [{ role: "system", content: getUnknownCallerPrompt(availableSlotsFormatted) }],
      },
      metadata: {
        callType: "inbound",
        knownLead: false,
        customerPhone,
      },
    },
  });
}

function getUnknownCallerPrompt(availableSlots?: string): string {
  let prompt = `You are Sarah, a friendly AI sales representative handling an inbound call.

## Your Goals
1. Greet the caller warmly
2. Find out who they are (name, company, role)
3. Understand why they're calling
4. Qualify them (what they're looking for, timeline, budget range)
5. If they're a good fit, offer to schedule a follow-up meeting

## Important
- Be conversational and helpful
- Capture their name, company, email, and phone if they haven't provided it
- Ask what prompted their call
- Listen carefully to understand their needs

## Data to Collect
- Full name
- Company name
- Job title/role
- Email address
- What they're looking for
- Their timeline
- How they heard about us
`;

  if (availableSlots) {
    prompt += `\n## Meeting Scheduling\nIf they want to schedule a meeting, here are available times:\n${availableSlots}\n`;
  }

  return prompt;
}

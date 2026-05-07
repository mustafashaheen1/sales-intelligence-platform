import { NextRequest, NextResponse } from "next/server";
import { createScheduledEvent, getCalendlyUser, getEventTypes } from "@/lib/calendly";
import { getLead, updateLead } from "@/lib/airtable";

export async function POST(request: NextRequest) {
  try {
    const { leadId, startTime, timezone } = await request.json();

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    const lead = await getLead(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const user = await getCalendlyUser();
    const eventTypes = await getEventTypes(user.uri);

    if (eventTypes.length === 0) {
      return NextResponse.json({ error: "No event types configured" }, { status: 400 });
    }

    const result = await createScheduledEvent({
      eventTypeUri: eventTypes[0].uri,
      inviteeEmail: lead.email,
      inviteeName: lead.name,
      startTime,
      timezone,
    });

    await updateLead(leadId, {
      scheduledMeeting: startTime,
      meetingLink: result.joinUrl,
    });

    return NextResponse.json({
      success: true,
      meetingLink: result.joinUrl,
      startTime,
    });
  } catch (error) {
    console.error("Calendly schedule error:", error);
    return NextResponse.json({ error: "Failed to schedule meeting" }, { status: 500 });
  }
}

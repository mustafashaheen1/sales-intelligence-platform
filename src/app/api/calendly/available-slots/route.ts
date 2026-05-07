import { NextRequest, NextResponse } from "next/server";
import { getCalendlyUser, getEventTypes, getAvailableSlots, formatSlotsForAI } from "@/lib/calendly";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "7");

    const user = await getCalendlyUser();
    const eventTypes = await getEventTypes(user.uri);

    if (eventTypes.length === 0) {
      return NextResponse.json({ error: "No event types configured in Calendly" }, { status: 400 });
    }

    const eventType = eventTypes[0];

    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const slots = await getAvailableSlots(eventType.uri, startDate, endDate);
    const availableSlots = slots.filter((s) => s.available);

    return NextResponse.json({
      eventType: {
        uri: eventType.uri,
        name: eventType.name,
        duration: eventType.duration,
        schedulingUrl: eventType.schedulingUrl,
      },
      slots: availableSlots,
      formatted: formatSlotsForAI(availableSlots),
    });
  } catch (error) {
    console.error("Calendly available slots error:", error);
    return NextResponse.json({ error: "Failed to fetch available slots" }, { status: 500 });
  }
}

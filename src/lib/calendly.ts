import { CalendlySlot } from "@/types";

const CALENDLY_API_BASE = "https://api.calendly.com";

function getHeaders() {
  if (!process.env.CALENDLY_API_KEY) {
    throw new Error("Calendly API key not configured");
  }
  return {
    Authorization: `Bearer ${process.env.CALENDLY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

// Get the current user's URI (needed for other API calls)
export async function getCalendlyUser(): Promise<{ uri: string; name: string; email: string }> {
  const response = await fetch(`${CALENDLY_API_BASE}/users/me`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to get Calendly user");
  }

  const data = await response.json();
  return {
    uri: data.resource.uri,
    name: data.resource.name,
    email: data.resource.email,
  };
}

// Get event types (meeting types) for the user
export async function getEventTypes(userUri: string): Promise<Array<{
  uri: string;
  name: string;
  duration: number;
  schedulingUrl: string;
}>> {
  const response = await fetch(
    `${CALENDLY_API_BASE}/event_types?user=${encodeURIComponent(userUri)}&active=true`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    throw new Error("Failed to get event types");
  }

  const data = await response.json();
  return data.collection.map((event: any) => ({
    uri: event.uri,
    name: event.name,
    duration: event.duration,
    schedulingUrl: event.scheduling_url,
  }));
}

// Get available time slots for a specific event type.
// startTime and endTime must be full ISO timestamps; range must not exceed 7 days.
export async function getAvailableSlots(
  eventTypeUri: string,
  startTime: string, // Full ISO timestamp (e.g. new Date().toISOString())
  endTime: string    // Full ISO timestamp, max 7 days after startTime
): Promise<CalendlySlot[]> {
  const response = await fetch(
    `${CALENDLY_API_BASE}/event_type_available_times?event_type=${encodeURIComponent(eventTypeUri)}&start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Calendly available times error:", errorText);
    throw new Error("Failed to get available slots");
  }

  const data = await response.json();
  return data.collection.map((slot: any) => ({
    startTime: slot.start_time,
    endTime: slot.end_time,
    available: slot.status === "available",
  }));
}

// Format available slots for AI to read during call
export function formatSlotsForAI(slots: CalendlySlot[]): string {
  if (slots.length === 0) {
    return "No available slots in the requested time range.";
  }

  const slotsByDate: Record<string, CalendlySlot[]> = {};
  slots.forEach((slot) => {
    const date = new Date(slot.startTime).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!slotsByDate[date]) slotsByDate[date] = [];
    slotsByDate[date].push(slot);
  });

  let formatted = "Available meeting times:\n";
  Object.entries(slotsByDate)
    .slice(0, 5)
    .forEach(([date, dateSlots]) => {
      formatted += `\n${date}:\n`;
      dateSlots.slice(0, 6).forEach((slot) => {
        const time = new Date(slot.startTime).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        formatted += `  - ${time}\n`;
      });
    });

  return formatted;
}

// Create a prefilled scheduling link for a lead
export async function createScheduledEvent(params: {
  eventTypeUri: string;
  inviteeEmail: string;
  inviteeName: string;
  startTime: string;
  timezone?: string;
}): Promise<{ eventUri: string; inviteeUri: string; joinUrl: string }> {
  const user = await getCalendlyUser();
  const eventTypes = await getEventTypes(user.uri);
  const eventType = eventTypes.find((et) => et.uri === params.eventTypeUri);

  if (!eventType) {
    throw new Error("Event type not found");
  }

  const schedulingUrl = new URL(eventType.schedulingUrl);
  schedulingUrl.searchParams.set("name", params.inviteeName);
  schedulingUrl.searchParams.set("email", params.inviteeEmail);
  if (params.timezone) {
    schedulingUrl.searchParams.set("timezone", params.timezone);
  }

  return {
    eventUri: params.eventTypeUri,
    inviteeUri: "",
    joinUrl: schedulingUrl.toString(),
  };
}

// Create a single-use scheduling link (prospect clicks to confirm booking)
export async function createSchedulingLink(
  eventTypeUri: string,
  maxEventCount = 1
): Promise<{ booking_url: string } | null> {
  if (!process.env.CALENDLY_API_KEY) {
    console.error("CALENDLY_API_KEY not configured");
    return null;
  }
  try {
    const response = await fetch(`${CALENDLY_API_BASE}/scheduling_links`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        max_event_count: maxEventCount,
        owner: eventTypeUri,
        owner_type: "EventType",
      }),
    });
    if (!response.ok) {
      const error = await response.text();
      console.error("Calendly scheduling link error:", error);
      return null;
    }
    const data = await response.json();
    return data.resource;
  } catch (error) {
    console.error("Error creating scheduling link:", error);
    return null;
  }
}

// Get a single-use booking link using the first active 30-min event type
export async function generateMeetingLink(): Promise<string | null> {
  if (!process.env.CALENDLY_API_KEY) return null;
  try {
    const user = await getCalendlyUser();
    const eventTypes = await getEventTypes(user.uri);
    if (eventTypes.length === 0) {
      console.error("No active Calendly event types found");
      return null;
    }
    const meetingType =
      eventTypes.find((et) => et.duration === 30 || et.name.toLowerCase().includes("30")) ||
      eventTypes[0];
    const link = await createSchedulingLink(meetingType.uri);
    return link?.booking_url || null;
  } catch (error) {
    console.error("Error generating meeting link:", error);
    return null;
  }
}

// Get upcoming scheduled events
export async function getScheduledEvents(userUri: string): Promise<Array<{
  uri: string;
  name: string;
  startTime: string;
  endTime: string;
  status: string;
}>> {
  const now = new Date().toISOString();
  const response = await fetch(
    `${CALENDLY_API_BASE}/scheduled_events?user=${encodeURIComponent(userUri)}&min_start_time=${now}&status=active&sort=start_time:asc&count=20`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    throw new Error("Failed to get scheduled events");
  }

  const data = await response.json();
  return data.collection.map((event: any) => ({
    uri: event.uri,
    name: event.name,
    startTime: event.start_time,
    endTime: event.end_time,
    status: event.status,
  }));
}

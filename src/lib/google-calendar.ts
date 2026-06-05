interface CalendarEvent {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail?: string;
  attendeeName?: string;
}

interface CreatedEvent {
  id: string;
  htmlLink: string;
  hangoutLink?: string;
}

// Parse natural language time like "Tuesday, June 9th at 1 PM" to a Date
export function parseScheduledTime(timeString: string): Date | null {
  try {
    const currentYear = new Date().getFullYear();

    // Remove ordinal suffixes, commas, and "at"
    const cleaned = timeString
      .replace(/(\d+)(st|nd|rd|th)/g, "$1")
      .replace(" at ", " ")
      .replace(/,/g, "")
      .trim();

    const withYear = `${cleaned} ${currentYear}`;
    const direct = new Date(withYear);
    if (!isNaN(direct.getTime())) return direct;

    // Manual fallback: "Tuesday June 9 1 PM" / "Tuesday June 9 1:00 PM"
    const match = timeString.match(
      /\w+\s+(\w+)\s+(\d+)(?:st|nd|rd|th)?\s+(?:at\s+)?(\d+)(?::(\d+))?\s*(AM|PM)/i
    );
    if (match) {
      const monthNames: Record<string, number> = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
      };
      const month = monthNames[match[1].toLowerCase()];
      const day = parseInt(match[2]);
      let hour = parseInt(match[3]);
      const minute = parseInt(match[4] || "0");
      const ampm = match[5].toUpperCase();
      if (ampm === "PM" && hour !== 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
      const date = new Date(currentYear, month, day, hour, minute);
      if (!isNaN(date.getTime())) return date;
    }

    console.error("Could not parse scheduled time:", timeString);
    return null;
  } catch (error) {
    console.error("Error parsing scheduled time:", error);
    return null;
  }
}

// Build event details from call data
export function buildMeetingEvent(
  leadName: string,
  companyName: string,
  scheduledTime: string,
  leadEmail?: string
): CalendarEvent | null {
  const startTime = parseScheduledTime(scheduledTime);
  if (!startTime) return null;

  const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

  return {
    summary: `Coder Crew AI Demo - ${leadName} (${companyName})`,
    description: `AI Solutions Demo Call\n\nLead: ${leadName}\nCompany: ${companyName}\n\nScheduled via Sales Intelligence Platform`,
    startTime,
    endTime,
    attendeeEmail: leadEmail,
    attendeeName: leadName,
  };
}

// Placeholder for direct Google Calendar booking.
// Actual implementation via Google Calendar API or MCP.
export async function createGoogleCalendarEvent(
  event: CalendarEvent
): Promise<CreatedEvent | null> {
  console.log("Would create Google Calendar event:", {
    summary: event.summary,
    start: event.startTime.toISOString(),
    end: event.endTime.toISOString(),
    attendee: event.attendeeEmail,
  });
  return null;
}

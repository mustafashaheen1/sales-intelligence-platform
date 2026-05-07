import { NextRequest, NextResponse } from "next/server";
import { scheduleVapiCall } from "@/lib/vapi";
import { getLead, updateLead } from "@/lib/airtable";
import { formatPhoneForVapi } from "@/lib/utils";
import { getCalendlyUser, getEventTypes, getAvailableSlots, formatSlotsForAI } from "@/lib/calendly";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, leadName, leadCompany, leadId } = body;

    if (!phoneNumber || !leadName) {
      return NextResponse.json(
        { error: "Phone number and lead name are required" },
        { status: 400 }
      );
    }

    let lead = null;
    let company = null;
    let availableSlotsFormatted = "";
    let schedulingLink = "";

    if (leadId) {
      lead = await getLead(leadId);

      // Get company data if linked
      if (lead?.companyLinkId) {
        try {
          const companyRes = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/companies/${lead.companyLinkId}`
          );
          if (companyRes.ok) {
            const companyData = await companyRes.json();
            company = companyData.company;
          }
        } catch (e) {
          console.error("Failed to fetch company:", e);
        }
      }

      // Get Calendly availability if configured
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
            const available = slots.filter((s) => s.available);
            availableSlotsFormatted = formatSlotsForAI(available);
            schedulingLink = eventTypes[0].schedulingUrl;
          }
        } catch (e) {
          console.error("Failed to fetch Calendly slots:", e);
        }
      }
    }

    const formattedPhone = formatPhoneForVapi(phoneNumber);

    const result = await scheduleVapiCall({
      phoneNumber: formattedPhone,
      leadName,
      leadCompany,
      leadId,
      lead: lead || undefined,
      company,
      availableSlots: availableSlotsFormatted,
      schedulingLink,
    });

    // Update lead status and increment call count
    if (leadId) {
      const currentCallCount = lead?.callCount || 0;
      await updateLead(leadId, {
        vapiCallStatus: "Scheduled",
        callCount: currentCallCount + 1,
      });
    }

    return NextResponse.json({
      success: true,
      callId: result.callId,
      status: result.status,
      message: `Call initiated to ${leadName}`,
    });
  } catch (error) {
    console.error("Schedule call error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to schedule call" },
      { status: 500 }
    );
  }
}

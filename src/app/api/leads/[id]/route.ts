import { NextRequest, NextResponse } from "next/server";
import { getLead, updateLead, deleteLead } from "@/lib/airtable";
import { getDemoLeads } from "@/lib/demo-data";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (isDemoMode()) {
      const lead = getDemoLeads().find((l) => l.id === params.id);
      if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      return NextResponse.json({ lead });
    }
    const lead = await getLead(params.id);
    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    if (isDemoMode()) {
      const lead = getDemoLeads().find((l) => l.id === params.id);
      if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      return NextResponse.json({ lead: { ...lead, ...body } });
    }
    const lead = await updateLead(params.id, body);
    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (isDemoMode()) {
      return NextResponse.json({ success: true });
    }
    await deleteLead(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}

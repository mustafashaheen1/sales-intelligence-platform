import Airtable from "airtable";
import { Lead, Activity, LeadSource, LeadStatus, ScoreLabel, VapiCallStatus, ActivityType, ActivityOutcome } from "@/types";

// Cache for the actual Airtable select option values fetched via metadata API
let cachedScoreLabelOptions: string[] | null = null;

async function fetchScoreLabelOptions(): Promise<string[]> {
  if (cachedScoreLabelOptions) return cachedScoreLabelOptions;

  try {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const apiKey = process.env.AIRTABLE_API_KEY;
    if (!baseId || !apiKey) return [];

    const res = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) {
      console.warn("Failed to fetch Airtable metadata:", res.status);
      return [];
    }
    const meta = await res.json();
    const leadsTable = meta.tables?.find((t: any) => t.name === "Leads");
    const scoreLabelField = leadsTable?.fields?.find((f: any) => f.name === "AI Score Label");
    const options = scoreLabelField?.options?.choices?.map((c: any) => c.name) || [];
    console.log("Airtable AI Score Label options:", JSON.stringify(options));
    cachedScoreLabelOptions = options;
    return options;
  } catch (e) {
    console.warn("Error fetching Airtable metadata:", e);
    return [];
  }
}

async function resolveScoreLabel(label: string): Promise<string> {
  // Strip any quote characters
  const cleaned = label.replace(/["']/g, "").trim();
  console.log("resolveScoreLabel cleaned:", JSON.stringify(cleaned));

  // Try to match against actual Airtable options (exact byte match)
  const options = await fetchScoreLabelOptions();
  if (options.length > 0) {
    const exact = options.find((o) => o === cleaned);
    if (exact) {
      console.log("resolveScoreLabel exact match:", JSON.stringify(exact));
      return exact;
    }
    // Fuzzy match: compare without emojis to find the right option
    const prefix = cleaned.replace(/[^\w\s]/g, "").trim().toLowerCase();
    const fuzzy = options.find((o) => o.replace(/[^\w\s]/g, "").trim().toLowerCase() === prefix);
    if (fuzzy) {
      console.log("resolveScoreLabel fuzzy match:", JSON.stringify(fuzzy));
      return fuzzy;
    }
    console.warn("resolveScoreLabel no match found for:", JSON.stringify(cleaned), "in options:", JSON.stringify(options));
  }

  // Fallback: return the cleaned value as-is
  return cleaned;
}

const getBase = () => {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    throw new Error("Airtable credentials not configured");
  }
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
};

function mapRecordToLead(record: any): Lead {
  return {
    id: record.id,
    name: record.get("Name") || "",
    email: record.get("Email") || "",
    phone: record.get("Phone") || undefined,
    company: record.get("Company") || undefined,
    title: record.get("Title") || undefined,
    linkedinUrl: record.get("LinkedIn URL") || undefined,
    leadSource: record.get("Lead Source") as LeadSource | undefined,
    status: (record.get("Status") as LeadStatus) || "New",
    aiScore: record.get("AI Score") || undefined,
    aiScoreLabel: record.get("AI Score Label") as ScoreLabel | undefined,
    aiInsights: record.get("AI Insights") || undefined,
    keyStrengths: record.get("Key Strengths") ? JSON.parse(record.get("Key Strengths")) : undefined,
    concerns: record.get("Concerns") ? JSON.parse(record.get("Concerns")) : undefined,
    suggestedNextStep: record.get("Suggested Next Step") || undefined,
    lastContacted: record.get("Last Contacted") || undefined,
    nextFollowUp: record.get("Next Follow Up") || undefined,
    notes: record.get("Notes") || undefined,
    vapiCallStatus: record.get("Vapi Call Status") as VapiCallStatus | undefined,
    vapiCallSummary: record.get("Vapi Call Summary") || undefined,
    createdAt: record.get("Created") || undefined,
  };
}

function mapRecordToActivity(record: any): Activity {
  return {
    id: record.id,
    activityType: record.get("Activity Type") as ActivityType,
    leadId: record.get("Lead")?.[0] || "",
    description: record.get("Description") || "",
    outcome: record.get("Outcome") as ActivityOutcome | undefined,
    createdAt: record.get("Created") || undefined,
  };
}

export async function getLeads(options?: {
  filterByFormula?: string;
  sort?: { field: string; direction: "asc" | "desc" }[];
  maxRecords?: number;
  offset?: string;
}): Promise<{ leads: Lead[]; offset?: string }> {
  const base = getBase();
  const query: any = {
    pageSize: options?.maxRecords || 100,
  };
  if (options?.filterByFormula) query.filterByFormula = options.filterByFormula;
  if (options?.sort) query.sort = options.sort;

  const records = await base("Leads").select(query).firstPage();
  return {
    leads: records.map(mapRecordToLead),
  };
}

export async function getLead(id: string): Promise<Lead> {
  const base = getBase();
  const record = await base("Leads").find(id);
  return mapRecordToLead(record);
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  const base = getBase();
  const fields: any = {
    Name: data.name,
    Email: data.email,
  };
  if (data.phone) fields["Phone"] = data.phone;
  if (data.company) fields["Company"] = data.company;
  if (data.title) fields["Title"] = data.title;
  if (data.linkedinUrl) fields["LinkedIn URL"] = data.linkedinUrl;
  if (data.leadSource) fields["Lead Source"] = data.leadSource;
  if (data.status) fields["Status"] = data.status;
  if (data.notes) fields["Notes"] = data.notes;
  if (data.aiScore !== undefined) fields["AI Score"] = data.aiScore;
  if (data.aiScoreLabel) {
    fields["AI Score Label"] = await resolveScoreLabel(data.aiScoreLabel);
  }
  if (data.aiInsights) fields["AI Insights"] = data.aiInsights;
  if (data.keyStrengths) fields["Key Strengths"] = JSON.stringify(data.keyStrengths);
  if (data.concerns) fields["Concerns"] = JSON.stringify(data.concerns);
  if (data.suggestedNextStep) fields["Suggested Next Step"] = data.suggestedNextStep;

  console.log("createLead fields:", JSON.stringify(fields, null, 2));
  const record = await base("Leads").create(fields);
  return mapRecordToLead(record);
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  const base = getBase();
  const fields: any = {};
  if (data.name !== undefined) fields["Name"] = data.name;
  if (data.email !== undefined) fields["Email"] = data.email;
  if (data.phone !== undefined) fields["Phone"] = data.phone;
  if (data.company !== undefined) fields["Company"] = data.company;
  if (data.title !== undefined) fields["Title"] = data.title;
  if (data.linkedinUrl !== undefined) fields["LinkedIn URL"] = data.linkedinUrl;
  if (data.leadSource !== undefined) fields["Lead Source"] = data.leadSource;
  if (data.status !== undefined) fields["Status"] = data.status;
  if (data.notes !== undefined) fields["Notes"] = data.notes;
  if (data.aiScore !== undefined) fields["AI Score"] = data.aiScore;
  if (data.aiScoreLabel !== undefined) {
    fields["AI Score Label"] = await resolveScoreLabel(data.aiScoreLabel);
  }
  if (data.aiInsights !== undefined) fields["AI Insights"] = data.aiInsights;
  if (data.keyStrengths !== undefined) fields["Key Strengths"] = JSON.stringify(data.keyStrengths);
  if (data.concerns !== undefined) fields["Concerns"] = JSON.stringify(data.concerns);
  if (data.suggestedNextStep !== undefined) fields["Suggested Next Step"] = data.suggestedNextStep;
  if (data.lastContacted !== undefined) fields["Last Contacted"] = data.lastContacted;
  if (data.nextFollowUp !== undefined) fields["Next Follow Up"] = data.nextFollowUp;
  if (data.vapiCallStatus !== undefined) fields["Vapi Call Status"] = data.vapiCallStatus;
  if (data.vapiCallSummary !== undefined) fields["Vapi Call Summary"] = data.vapiCallSummary;

  console.log("updateLead fields:", JSON.stringify(fields, null, 2));
  const record = await base("Leads").update(id, fields);
  return mapRecordToLead(record);
}

export async function deleteLead(id: string): Promise<void> {
  const base = getBase();
  await base("Leads").destroy(id);
}

export async function getActivities(leadId?: string): Promise<Activity[]> {
  const base = getBase();
  const query: any = {
    sort: [{ field: "Created", direction: "desc" }],
  };
  if (leadId) {
    query.filterByFormula = `FIND("${leadId}", ARRAYJOIN({Lead}))`;
  }
  const records = await base("Activities").select(query).firstPage();
  return records.map(mapRecordToActivity);
}

export async function createActivity(data: {
  activityType: ActivityType;
  leadId: string;
  description: string;
  outcome?: ActivityOutcome;
}): Promise<Activity> {
  const base = getBase();
  const fields: any = {
    "Activity Type": data.activityType,
    Lead: [data.leadId],
    Description: data.description,
  };
  if (data.outcome) fields["Outcome"] = data.outcome;
  const record = await base("Activities").create(fields);
  return mapRecordToActivity(record);
}

import Airtable from "airtable";
import { Lead, Company, Activity, LeadSource, LeadStatus, ScoreLabel, VapiCallStatus, ActivityType, ActivityOutcome } from "@/types";
import { normalizePhone, formatPhoneForVapi } from "@/lib/utils";

const VALID_SCORE_LABELS: ScoreLabel[] = ["Hot 🔥", "Warm 🌡️", "Cold ❄️"];

function cleanFieldValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return String(value);
  return value
    .replace(/^["']+|["']+$/g, '')
    .replace(/^""+|""+$/g, '')
    .trim();
}

function cleanScoreLabel(label: string): ScoreLabel {
  const cleaned = label.replace(/["']/g, "").trim();
  if (VALID_SCORE_LABELS.includes(cleaned as ScoreLabel)) {
    return cleaned as ScoreLabel;
  }
  if (cleaned.toLowerCase().startsWith("hot")) return "Hot 🔥";
  if (cleaned.toLowerCase().startsWith("warm")) return "Warm 🌡️";
  return "Cold ❄️";
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
    vapiCallData: record.get("Vapi Call Data") || undefined,
    companySize: record.get("Company Size") || undefined,
    industry: record.get("Industry") || undefined,
    companyLinkedin: record.get("Company LinkedIn") || undefined,
    enrichmentData: record.get("Enrichment Data") || undefined,
    enrichedAt: record.get("Enriched At") || undefined,
    website: record.get("Website") || undefined,
    companyLinkId: record.get("Company Link")?.[0] || undefined,
    outreachStrategy: record.get("Outreach Strategy") || undefined,
    recommendedChannel: record.get("Recommended Channel") || undefined,
    approachTone: record.get("Approach Tone") || undefined,
    createdAt: record.get("Created") || undefined,
    callCount: record.get("Call Count") as number | undefined,
    lastCallSummary: record.get("Last Call Summary") as string | undefined,
    lastCallDate: record.get("Last Call Date") as string | undefined,
    callHistory: record.get("Call History") as string | undefined,
    scheduledMeeting: record.get("Scheduled Meeting") as string | undefined,
    meetingLink: record.get("Meeting Link") as string | undefined,
    competitorInfo: record.get("Competitor Info") as string | undefined,
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
    pageSize: 100, // Airtable max per page
  };
  if (options?.maxRecords) query.maxRecords = options.maxRecords;
  if (options?.filterByFormula) query.filterByFormula = options.filterByFormula;
  if (options?.sort) query.sort = options.sort;

  const records = await base("Leads").select(query).all();
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
  if (data.phone) fields["Phone"] = normalizePhone(data.phone);
  if (data.company) fields["Company"] = data.company;
  if (data.title) fields["Title"] = data.title;
  if (data.linkedinUrl) fields["LinkedIn URL"] = data.linkedinUrl;
  if (data.leadSource) fields["Lead Source"] = data.leadSource;
  if (data.status) fields["Status"] = data.status;
  if (data.notes) fields["Notes"] = data.notes;
  if (data.aiScore !== undefined) fields["AI Score"] = data.aiScore;
  if (data.aiScoreLabel) {
    fields["AI Score Label"] = cleanScoreLabel(data.aiScoreLabel);
  }
  if (data.aiInsights) fields["AI Insights"] = data.aiInsights;
  if (data.keyStrengths) fields["Key Strengths"] = JSON.stringify(data.keyStrengths);
  if (data.concerns) fields["Concerns"] = JSON.stringify(data.concerns);
  if (data.suggestedNextStep) fields["Suggested Next Step"] = data.suggestedNextStep;
  if (data.vapiCallStatus) fields["Vapi Call Status"] = data.vapiCallStatus;
  if (data.vapiCallSummary) fields["Vapi Call Summary"] = data.vapiCallSummary;
  if (data.vapiCallData) fields["Vapi Call Data"] = data.vapiCallData;
  if (data.callCount !== undefined) fields["Call Count"] = data.callCount;
  if (data.lastCallDate) fields["Last Call Date"] = data.lastCallDate;
  if (data.lastCallSummary) fields["Last Call Summary"] = data.lastCallSummary;
  if (data.callHistory) fields["Call History"] = data.callHistory;

  const record = await base("Leads").create(fields);
  return mapRecordToLead(record);
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  const base = getBase();
  const fields: any = {};
  if (data.name !== undefined) fields["Name"] = data.name;
  if (data.email !== undefined) fields["Email"] = data.email;
  if (data.phone !== undefined) fields["Phone"] = normalizePhone(data.phone);
  if (data.company !== undefined) fields["Company"] = data.company;
  if (data.title !== undefined) fields["Title"] = data.title;
  if (data.linkedinUrl !== undefined) fields["LinkedIn URL"] = data.linkedinUrl;
  if (data.leadSource !== undefined) fields["Lead Source"] = data.leadSource;
  if (data.status !== undefined) fields["Status"] = data.status;
  if (data.notes !== undefined) fields["Notes"] = data.notes;
  if (data.aiScore !== undefined) fields["AI Score"] = data.aiScore;
  if (data.aiScoreLabel !== undefined) {
    fields["AI Score Label"] = cleanScoreLabel(data.aiScoreLabel);
  }
  if (data.aiInsights !== undefined) fields["AI Insights"] = data.aiInsights;
  if (data.keyStrengths !== undefined) fields["Key Strengths"] = JSON.stringify(data.keyStrengths);
  if (data.concerns !== undefined) fields["Concerns"] = JSON.stringify(data.concerns);
  if (data.suggestedNextStep !== undefined) fields["Suggested Next Step"] = data.suggestedNextStep;
  if (data.lastContacted !== undefined) fields["Last Contacted"] = data.lastContacted;
  if (data.nextFollowUp !== undefined) fields["Next Follow Up"] = data.nextFollowUp;
  if (data.vapiCallStatus !== undefined) fields["Vapi Call Status"] = data.vapiCallStatus;
  if (data.vapiCallSummary !== undefined) fields["Vapi Call Summary"] = data.vapiCallSummary;
  if (data.vapiCallData !== undefined) fields["Vapi Call Data"] = data.vapiCallData;
  if (data.industry !== undefined) fields["Industry"] = cleanFieldValue(data.industry);
  if (data.companySize !== undefined) fields["Company Size"] = cleanFieldValue(data.companySize);
  if (data.enrichmentData !== undefined) fields["Enrichment Data"] = data.enrichmentData;
  if (data.enrichedAt !== undefined) fields["Enriched At"] = data.enrichedAt;
  if (data.companyLinkId !== undefined) fields["Company Link"] = [data.companyLinkId];
  if (data.outreachStrategy !== undefined) fields["Outreach Strategy"] = data.outreachStrategy;
  if (data.recommendedChannel !== undefined) fields["Recommended Channel"] = cleanFieldValue(data.recommendedChannel);
  if (data.approachTone !== undefined) fields["Approach Tone"] = cleanFieldValue(data.approachTone);
  if (data.callCount !== undefined) fields["Call Count"] = data.callCount;
  if (data.lastCallSummary !== undefined) fields["Last Call Summary"] = data.lastCallSummary;
  if (data.lastCallDate !== undefined) fields["Last Call Date"] = data.lastCallDate;
  if (data.callHistory !== undefined) fields["Call History"] = data.callHistory;
  if (data.scheduledMeeting !== undefined) fields["Scheduled Meeting"] = data.scheduledMeeting;
  if (data.meetingLink !== undefined) fields["Meeting Link"] = data.meetingLink;
  if (data.competitorInfo !== undefined) fields["Competitor Info"] = data.competitorInfo;

  const nonEmptyFields: any = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
  if (Object.keys(nonEmptyFields).length === 0) {
    console.warn("updateLead called with no mappable fields for lead:", id);
    return getLead(id);
  }

  console.log(`updateLead [${id}] fields:`, Object.keys(nonEmptyFields).join(", "));
  const record = await base("Leads").update(id, nonEmptyFields);
  return mapRecordToLead(record);
}

export async function findLeadByPhoneOrEmail(phone?: string, email?: string): Promise<{
  existingLead: Lead | null;
  duplicateField: "phone" | "email" | "both" | null;
}> {
  if (!phone && !email) return { existingLead: null, duplicateField: null };

  const base = getBase();
  const conditions: string[] = [];
  const normalizedPhone = phone ? normalizePhone(phone) : null;

  if (normalizedPhone) conditions.push(`{Phone} = "${normalizedPhone}"`);
  if (email) conditions.push(`{Email} = "${email.toLowerCase().trim()}"`);

  const formula = conditions.length === 2 ? `OR(${conditions.join(", ")})` : conditions[0];

  const records = await base("Leads").select({ filterByFormula: formula, maxRecords: 2 }).all();

  if (records.length === 0) return { existingLead: null, duplicateField: null };

  const lead = mapRecordToLead(records[0]);
  const phoneMatch = normalizedPhone && lead.phone && normalizePhone(lead.phone) === normalizedPhone;
  const emailMatch = email && lead.email && lead.email.toLowerCase().trim() === email.toLowerCase().trim();

  let duplicateField: "phone" | "email" | "both" | null = null;
  if (phoneMatch && emailMatch) duplicateField = "both";
  else if (phoneMatch) duplicateField = "phone";
  else if (emailMatch) duplicateField = "email";

  return { existingLead: lead, duplicateField };
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

// --- Companies ---

function mapRecordToCompany(record: any): Company {
  return {
    id: record.id,
    name: record.get("Company Name") || "",
    website: record.get("Website") || undefined,
    industry: record.get("Industry") || undefined,
    companySize: record.get("Company Size") || undefined,
    linkedinUrl: record.get("LinkedIn URL") || undefined,
    companyResearch: record.get("Company Research") || undefined,
    researchedAt: record.get("Researched At") || undefined,
    competitors: record.get("Competitors") as string | undefined,
    competitorAnalysis: record.get("Competitor Analysis") as string | undefined,
  };
}

export async function findCompanyByName(name: string): Promise<Company | null> {
  const base = getBase();
  const records = await base("Companies")
    .select({ filterByFormula: `{Company Name} = "${name.replace(/"/g, '\\"')}"`, maxRecords: 1 })
    .firstPage();
  return records.length > 0 ? mapRecordToCompany(records[0]) : null;
}

export async function getCompany(id: string): Promise<Company> {
  const base = getBase();
  const record = await base("Companies").find(id);
  return mapRecordToCompany(record);
}

export async function createCompany(data: Partial<Company>): Promise<Company> {
  const base = getBase();
  const fields: any = { "Company Name": data.name };
  if (data.website) fields["Website"] = data.website;
  if (data.industry) fields["Industry"] = data.industry;
  if (data.companySize) fields["Company Size"] = data.companySize;
  if (data.linkedinUrl) fields["LinkedIn URL"] = data.linkedinUrl;
  if (data.companyResearch) fields["Company Research"] = data.companyResearch;
  if (data.researchedAt) fields["Researched At"] = data.researchedAt;
  const record = await base("Companies").create(fields);
  return mapRecordToCompany(record);
}

export async function updateCompany(id: string, data: Partial<Company>): Promise<Company> {
  const base = getBase();
  const fields: any = {};
  if (data.name !== undefined) fields["Company Name"] = data.name;
  if (data.website !== undefined) fields["Website"] = data.website;
  if (data.industry !== undefined) fields["Industry"] = cleanFieldValue(data.industry);
  if (data.companySize !== undefined) fields["Company Size"] = cleanFieldValue(data.companySize);
  if (data.linkedinUrl !== undefined) fields["LinkedIn URL"] = data.linkedinUrl;
  if (data.companyResearch !== undefined) fields["Company Research"] = data.companyResearch;
  if (data.researchedAt !== undefined) fields["Researched At"] = data.researchedAt;
  if (data.competitors !== undefined) fields["Competitors"] = data.competitors;
  if (data.competitorAnalysis !== undefined) fields["Competitor Analysis"] = data.competitorAnalysis;
  const record = await base("Companies").update(id, fields);
  return mapRecordToCompany(record);
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

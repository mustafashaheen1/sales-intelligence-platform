export type LeadSource = "Website" | "LinkedIn" | "Referral" | "Cold Outreach" | "Event";
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
export type ScoreLabel = "Hot 🔥" | "Warm 🌡️" | "Cold ❄️";
export type VapiCallStatus = "Not Called" | "Scheduled" | "Completed" | "No Answer" | "Callback Requested";
export type ActivityType = "Email Sent" | "Call Made" | "Meeting Scheduled" | "Proposal Sent" | "Follow Up" | "Note Added";
export type ActivityOutcome = "Positive" | "Neutral" | "Negative" | "No Response";
export type OutreachType = "email" | "linkedin" | "sms";
export type OutreachTone = "professional" | "casual" | "friendly";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  linkedinUrl?: string;
  leadSource?: LeadSource;
  status: LeadStatus;
  aiScore?: number;
  aiScoreLabel?: ScoreLabel;
  aiInsights?: string;
  keyStrengths?: string[];
  concerns?: string[];
  suggestedNextStep?: string;
  lastContacted?: string;
  nextFollowUp?: string;
  notes?: string;
  vapiCallStatus?: VapiCallStatus;
  vapiCallSummary?: string;
  createdAt?: string;
}

export interface Activity {
  id: string;
  activityType: ActivityType;
  leadId: string;
  leadName?: string;
  description: string;
  outcome?: ActivityOutcome;
  createdAt?: string;
}

export interface Company {
  id: string;
  companyName: string;
  website?: string;
  industry?: string;
  companySize?: string;
  aiCompanyScore?: number;
  aiAnalysis?: string;
}

export interface AIScoreResult {
  score: number;
  scoreLabel: ScoreLabel;
  insights: string;
  keyStrengths: string[];
  concerns: string[];
  suggestedNextStep: string;
}

export interface OutreachRequest {
  leadId: string;
  type: OutreachType;
  tone: OutreachTone;
}

export interface OutreachResult {
  message: string;
  subject?: string;
  type: OutreachType;
  tone: OutreachTone;
}

export interface VapiCall {
  id: string;
  leadId: string;
  leadName: string;
  scheduledAt?: string;
  completedAt?: string;
  duration?: number;
  outcome?: string;
  summary?: string;
  status: VapiCallStatus;
}

export interface AnalyticsOverview {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  conversionRate: number;
  callsScheduledToday: number;
}

export interface PipelineData {
  status: LeadStatus;
  count: number;
}

export interface SourceData {
  source: LeadSource;
  count: number;
}

export interface DemoData {
  leads: Lead[];
  activities: Activity[];
  calls: VapiCall[];
}

"use client";

import { Lead, Company } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, getStatusColor, getInitials, formatDate } from "@/lib/utils";
import { LeadScoreBadge } from "./lead-score-badge";
import {
  Mail, Phone, Building2, Briefcase, Globe, Linkedin,
  BrainCircuit, MessageSquare, PhoneCall, FileEdit, Loader2,
  CheckCircle2, AlertCircle, ArrowRight, Calendar, Sparkles, Users, Factory,
  Target, DollarSign, UserCheck, Lightbulb, Zap, MessageCircle,
  Newspaper, Code2, TrendingUp, Shield, Crosshair, Search,
  ChevronDown, ChevronUp, Copy, Clock, Hash, HelpCircle, ClipboardList,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// --- Parsers ---

interface EnrichmentParsed {
  company_summary?: string;
  industry?: string;
  estimated_company_size?: string;
  estimated_revenue?: string;
  lead_role_analysis?: string;
  seniority_level?: string;
  likely_pain_points?: string[];
  ai_automation_opportunities?: string[];
  recommended_approach?: string;
  talking_points?: string[];
  icp_fit_score?: number;
  icp_fit_reason?: string;
  [key: string]: any;
}

interface CompanyResearchParsed {
  company_overview?: string;
  products_services?: string[];
  target_market?: string;
  competitors?: string[];
  recent_news?: string[];
  tech_stack?: string[];
  company_culture?: string;
  growth_signals?: string[];
  potential_challenges?: string[];
  strategic_recommendations?: string;
  [key: string]: any;
}

interface OutreachSequenceStep {
  step: number;
  channel: string;
  timing: string;
  subject?: string | null;
  message: string;
}

interface ObjectionItem {
  objection: string;
  response: string;
}

interface MeetingAgendaItem {
  duration: string;
  topic: string;
}

interface OutreachParsed {
  recommended_channel?: string;
  approach_tone?: string;
  best_time_to_reach?: string;
  personalization_hooks?: string[];
  outreach_sequence?: OutreachSequenceStep[];
  objection_handling?: ObjectionItem[];
  discovery_questions?: string[];
  meeting_agenda?: MeetingAgendaItem[];
  [key: string]: any;
}

function parseNestedJson<T>(raw: string): T | null {
  try {
    const outer = JSON.parse(raw);
    if (outer.answer && typeof outer.answer === "string") {
      return JSON.parse(outer.answer);
    }
    if (outer.answer && typeof outer.answer === "object") {
      return outer.answer;
    }
    return outer;
  } catch {
    return null;
  }
}

// --- Helper Components ---

function getIcpColor(score: number): { bg: string; text: string; border: string; bar: string } {
  if (score >= 8) return { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", bar: "bg-emerald-500" };
  if (score >= 5) return { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", bar: "bg-amber-500" };
  return { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", bar: "bg-red-500" };
}

function CollapsibleSection({ title, icon: Icon, iconColor, children, defaultOpen = false }: {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium flex items-center gap-1.5">
          <Icon className={cn("h-3.5 w-3.5", iconColor || "text-primary")} /> {title}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-3 pb-3 pt-0">{children}</div>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };
  return (
    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={handleCopy}>
      <Copy className="h-3 w-3" />
    </Button>
  );
}

// --- Section 1 & 2: Lead Profile + Company Intelligence (shown in EnrichmentDataCard) ---

function EnrichmentDataCard({ enrichmentData, enrichedAt, companyResearch, researchedAt }: {
  enrichmentData?: string;
  enrichedAt?: string;
  companyResearch?: string;
  researchedAt?: string;
}) {
  const enrichData = useMemo(() => enrichmentData ? parseNestedJson<EnrichmentParsed>(enrichmentData) : null, [enrichmentData]);
  const researchData = useMemo(() => companyResearch ? parseNestedJson<CompanyResearchParsed>(companyResearch) : null, [companyResearch]);

  if (!enrichData && !researchData) return null;

  const icpScore = enrichData && typeof enrichData.icp_fit_score === "number" ? enrichData.icp_fit_score : null;
  const icpColor = icpScore !== null ? getIcpColor(icpScore) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Intelligence Report
        </CardTitle>
        {enrichedAt && (
          <span className="text-xs text-muted-foreground">{formatDate(enrichedAt)}</span>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Section 3: ICP Analysis */}
        {icpScore !== null && icpColor && (
          <div className={cn("p-3 rounded-lg border", icpColor.bg, icpColor.border)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Target className={cn("h-4 w-4", icpColor.text)} /> ICP Fit Score
              </span>
              <span className={cn("text-lg font-bold", icpColor.text)}>{icpScore}/10</span>
            </div>
            <div className="h-2 w-full rounded-full bg-background/50 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", icpColor.bar)}
                style={{ width: `${(icpScore / 10) * 100}%` }}
              />
            </div>
            {enrichData?.icp_fit_reason && (
              <p className="text-xs text-muted-foreground mt-2">{enrichData.icp_fit_reason}</p>
            )}
          </div>
        )}

        {/* Section 2: Company Intelligence */}
        {(enrichData?.company_summary || researchData?.company_overview || enrichData?.industry || enrichData?.estimated_company_size || enrichData?.estimated_revenue) && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Company Intelligence
            </h4>
            {(enrichData?.company_summary || researchData?.company_overview) && (
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                {researchData?.company_overview || enrichData?.company_summary}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(enrichData?.industry || researchData?.industry) && (
                <div className="p-2.5 rounded-lg bg-muted/30 border">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                    <Factory className="h-3 w-3" /> Industry
                  </span>
                  <p className="text-sm font-medium mt-1">{enrichData?.industry || researchData?.industry}</p>
                </div>
              )}
              {enrichData?.estimated_company_size && (
                <div className="p-2.5 rounded-lg bg-muted/30 border">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                    <Users className="h-3 w-3" /> Company Size
                  </span>
                  <p className="text-sm font-medium mt-1">{enrichData.estimated_company_size}</p>
                </div>
              )}
              {enrichData?.estimated_revenue && (
                <div className="p-2.5 rounded-lg bg-muted/30 border">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Est. Revenue
                  </span>
                  <p className="text-sm font-medium mt-1">{enrichData.estimated_revenue}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products & Services from research */}
        {researchData?.products_services && researchData.products_services.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-primary" /> Products & Services
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {researchData.products_services.map((item, i) => (
                <Badge key={i} variant="outline" className="text-xs">{item}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Target Market */}
        {researchData?.target_market && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Crosshair className="h-3.5 w-3.5 text-primary" /> Target Market
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{researchData.target_market}</p>
          </div>
        )}

        {/* Section 1: Lead Role Analysis */}
        {(enrichData?.lead_role_analysis || enrichData?.seniority_level) && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-primary" /> Lead Role Analysis
            </h4>
            {enrichData?.seniority_level && (
              <Badge variant="outline" className="mb-2 text-xs">{enrichData.seniority_level}</Badge>
            )}
            {enrichData?.lead_role_analysis && (
              <p className="text-sm text-muted-foreground leading-relaxed">{enrichData.lead_role_analysis}</p>
            )}
          </div>
        )}

        {/* Pain Points */}
        {enrichData?.likely_pain_points && enrichData.likely_pain_points.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Likely Pain Points
            </h4>
            <ul className="space-y-1.5">
              {enrichData.likely_pain_points.map((point, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">-</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Automation Opportunities */}
        {enrichData?.ai_automation_opportunities && enrichData.ai_automation_opportunities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-violet-500" /> AI Automation Opportunities
            </h4>
            <ul className="space-y-1.5">
              {enrichData.ai_automation_opportunities.map((opp, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5 shrink-0">+</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Competitors */}
        {researchData?.competitors && researchData.competitors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-orange-500" /> Competitors
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {researchData.competitors.map((c, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tech Stack */}
        {researchData?.tech_stack && researchData.tech_stack.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-violet-500" /> Tech Stack
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {researchData.tech_stack.map((t, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-violet-500/5 border-violet-500/20 text-violet-400">{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Growth Signals */}
        {researchData?.growth_signals && researchData.growth_signals.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Growth Signals
            </h4>
            <ul className="space-y-1.5">
              {researchData.growth_signals.map((signal, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 shrink-0">+</span>
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent News */}
        {researchData?.recent_news && researchData.recent_news.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Newspaper className="h-3.5 w-3.5 text-blue-500" /> Recent News
            </h4>
            <ul className="space-y-1.5">
              {researchData.recent_news.map((news, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5 shrink-0">&bull;</span>
                  <span>{news}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Company Culture */}
        {researchData?.company_culture && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" /> Company Culture
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{researchData.company_culture}</p>
          </div>
        )}

        {/* Potential Challenges */}
        {researchData?.potential_challenges && researchData.potential_challenges.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Potential Challenges
            </h4>
            <ul className="space-y-1.5">
              {researchData.potential_challenges.map((challenge, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">-</span>
                  <span>{challenge}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Approach / Strategic Recommendations */}
        {(enrichData?.recommended_approach || researchData?.strategic_recommendations) && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <h4 className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary" /> Strategic Recommendations
            </h4>
            {enrichData?.recommended_approach && (
              <p className="text-sm text-muted-foreground leading-relaxed">{enrichData.recommended_approach}</p>
            )}
            {researchData?.strategic_recommendations && enrichData?.recommended_approach && (
              <div className="border-t border-primary/10 my-2" />
            )}
            {researchData?.strategic_recommendations && (
              <p className="text-sm text-muted-foreground leading-relaxed">{researchData.strategic_recommendations}</p>
            )}
          </div>
        )}

        {/* Talking Points */}
        {enrichData?.talking_points && enrichData.talking_points.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-primary" /> Talking Points
            </h4>
            <ul className="space-y-1.5">
              {enrichData.talking_points.map((point, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5 shrink-0">{i + 1}.</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Section 4-8: Outreach Strategy Card ---

function OutreachStrategyCard({ outreachStrategy }: { outreachStrategy: string }) {
  const data = useMemo(() => parseNestedJson<OutreachParsed>(outreachStrategy), [outreachStrategy]);

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Outreach Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Section 4: Strategy Overview */}
        {(data.recommended_channel || data.approach_tone || data.best_time_to_reach) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.recommended_channel && (
              <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Channel
                </span>
                <Badge className="mt-1.5 text-xs">{data.recommended_channel}</Badge>
              </div>
            )}
            {data.approach_tone && (
              <div className="p-2.5 rounded-lg bg-muted/30 border">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Tone
                </span>
                <p className="text-sm font-medium mt-1">{data.approach_tone}</p>
              </div>
            )}
            {data.best_time_to_reach && (
              <div className="p-2.5 rounded-lg bg-muted/30 border">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Best Time
                </span>
                <p className="text-sm font-medium mt-1">{data.best_time_to_reach}</p>
              </div>
            )}
          </div>
        )}

        {/* Personalization Hooks */}
        {data.personalization_hooks && data.personalization_hooks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-primary" /> Personalization Hooks
            </h4>
            <ul className="space-y-1.5">
              {data.personalization_hooks.map((hook, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5 shrink-0">&bull;</span>
                  <span>{hook}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 5: Outreach Sequence (collapsible) */}
        {data.outreach_sequence && data.outreach_sequence.length > 0 && (
          <CollapsibleSection title={`Outreach Sequence (${data.outreach_sequence.length} steps)`} icon={ArrowRight} defaultOpen>
            <div className="space-y-3">
              {data.outreach_sequence.map((step, i) => (
                <div key={i} className="relative border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Step {step.step || i + 1}</Badge>
                      <Badge variant="secondary" className="text-xs">{step.channel}</Badge>
                      <span className="text-xs text-muted-foreground">{step.timing}</span>
                    </div>
                    <CopyButton text={step.subject ? `Subject: ${step.subject}\n\n${step.message}` : step.message} />
                  </div>
                  {step.subject && (
                    <p className="text-sm font-medium mb-1">Subject: {step.subject}</p>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{step.message}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Section 6: Objection Handling (collapsible) */}
        {data.objection_handling && data.objection_handling.length > 0 && (
          <CollapsibleSection title={`Objection Handling (${data.objection_handling.length})`} icon={Shield} iconColor="text-orange-500">
            <div className="space-y-3">
              {data.objection_handling.map((item, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <p className="text-sm font-medium text-orange-400 mb-1.5">&ldquo;{item.objection}&rdquo;</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.response}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Section 7: Discovery Questions (collapsible) */}
        {data.discovery_questions && data.discovery_questions.length > 0 && (
          <CollapsibleSection title={`Discovery Questions (${data.discovery_questions.length})`} icon={HelpCircle} iconColor="text-blue-500">
            <ul className="space-y-2">
              {data.discovery_questions.map((q, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5 shrink-0 font-medium">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* Section 8: Meeting Agenda (collapsible) */}
        {data.meeting_agenda && data.meeting_agenda.length > 0 && (
          <CollapsibleSection title="Meeting Agenda" icon={ClipboardList} iconColor="text-emerald-500">
            <div className="space-y-2">
              {data.meeting_agenda.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-1.5">
                  <Badge variant="outline" className="text-xs shrink-0 bg-emerald-500/5 border-emerald-500/20 text-emerald-400">{item.duration}</Badge>
                  <p className="text-sm text-muted-foreground">{item.topic}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </CardContent>
    </Card>
  );
}

// --- Main Component ---

interface LeadDetailCardProps {
  lead: Lead;
  onScore: () => Promise<void>;
  onScheduleCall: () => Promise<void>;
  onEnrich: () => Promise<void>;
  companyData?: Company | null;
  enrichProgress?: string;
}

export function LeadDetailCard({ lead, onScore, onScheduleCall, onEnrich, companyData, enrichProgress }: LeadDetailCardProps) {
  const [scoring, setScoring] = useState(false);
  const [schedulingCall, setSchedulingCall] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const handleScore = async () => {
    setScoring(true);
    try {
      await onScore();
      toast.success("Lead re-scored!");
    } catch {
      toast.error("Failed to score lead");
    } finally {
      setScoring(false);
    }
  };

  const handleScheduleCall = async () => {
    setSchedulingCall(true);
    try {
      await onScheduleCall();
      toast.success("Call scheduled!");
    } catch {
      toast.error("Failed to schedule call");
    } finally {
      setSchedulingCall(false);
    }
  };

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      await onEnrich();
      toast.success("Lead enriched with outreach strategy!");
    } catch {
      toast.error("Failed to enrich lead");
    } finally {
      setEnriching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
              {getInitials(lead.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{lead.name}</h2>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    {lead.title && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" /> {lead.title}
                      </span>
                    )}
                    {lead.company && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" /> {lead.company}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-xs", getStatusColor(lead.status))}>
                  {lead.status}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {lead.email}
                </span>
                {lead.phone && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {lead.phone}
                  </span>
                )}
                {lead.linkedinUrl && (
                  <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
              </div>

              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                {lead.leadSource && <span>Source: {lead.leadSource}</span>}
                {lead.lastContacted && <span>Last contacted: {formatDate(lead.lastContacted)}</span>}
                {lead.nextFollowUp && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Follow up: {formatDate(lead.nextFollowUp)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Score Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" /> AI Score & Insights
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleScore} disabled={scoring}>
            {scoring ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <BrainCircuit className="h-3.5 w-3.5 mr-1" />}
            Re-Score
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <LeadScoreBadge score={lead.aiScore} label={lead.aiScoreLabel} size="lg" />
          </div>

          {lead.aiInsights && (
            <p className="text-sm text-muted-foreground leading-relaxed">{lead.aiInsights}</p>
          )}

          {lead.keyStrengths && lead.keyStrengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Key Strengths
              </h4>
              <ul className="space-y-1">
                {lead.keyStrengths.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">+</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lead.concerns && lead.concerns.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Concerns
              </h4>
              <ul className="space-y-1">
                {lead.concerns.map((c, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-amber-500 mt-1">-</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lead.suggestedNextStep && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-primary">Suggested Next Step</span>
                <p className="text-sm mt-0.5">{lead.suggestedNextStep}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={handleScheduleCall} disabled={schedulingCall}>
              {schedulingCall ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <PhoneCall className="h-3.5 w-3.5 mr-1" />}
              Schedule Vapi Call
            </Button>
            <Button size="sm" variant="outline" onClick={handleEnrich} disabled={enriching || !(lead.name && (lead.email || lead.company))}>
              {enriching ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              {enriching ? (enrichProgress || "Enriching...") : "Enrich Lead"}
            </Button>
          </div>

          {/* Enrichment progress indicator */}
          {enriching && enrichProgress && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">{enrichProgress}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vapi Call Summary */}
      {lead.vapiCallSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-primary" /> Call Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={cn("text-xs",
                lead.vapiCallStatus === "Completed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                lead.vapiCallStatus === "Scheduled" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                "bg-slate-500/10 text-slate-400 border-slate-500/20"
              )}>
                {lead.vapiCallStatus}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{lead.vapiCallSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Intelligence Report (combined enrichment + company research) */}
      {(lead.enrichmentData || companyData?.companyResearch) && (
        <EnrichmentDataCard
          enrichmentData={lead.enrichmentData}
          enrichedAt={lead.enrichedAt}
          companyResearch={companyData?.companyResearch}
          researchedAt={companyData?.researchedAt}
        />
      )}

      {/* Outreach Strategy */}
      {lead.outreachStrategy && <OutreachStrategyCard outreachStrategy={lead.outreachStrategy} />}

      {/* Notes */}
      {lead.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileEdit className="h-4 w-4" /> Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

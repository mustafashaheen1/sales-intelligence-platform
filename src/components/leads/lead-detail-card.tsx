"use client";

import { Lead } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, getStatusColor, getInitials, formatDate } from "@/lib/utils";
import { LeadScoreBadge } from "./lead-score-badge";
import {
  Mail, Phone, Building2, Briefcase, Globe, Linkedin,
  BrainCircuit, MessageSquare, PhoneCall, FileEdit, Loader2,
  CheckCircle2, AlertCircle, ArrowRight, Calendar, Sparkles, Users, Factory,
  Target, DollarSign, UserCheck, Lightbulb, Zap, MessageCircle, Search,
  Newspaper, Code2, TrendingUp, Shield, Crosshair,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

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

function parseEnrichmentData(raw: string): EnrichmentParsed | null {
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

function getIcpColor(score: number): { bg: string; text: string; border: string; bar: string } {
  if (score >= 8) return { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", bar: "bg-emerald-500" };
  if (score >= 5) return { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", bar: "bg-amber-500" };
  return { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", bar: "bg-red-500" };
}

function EnrichmentDataCard({ enrichmentData, enrichedAt }: { enrichmentData: string; enrichedAt?: string }) {
  const data = useMemo(() => parseEnrichmentData(enrichmentData), [enrichmentData]);

  if (!data) return null;

  const icpScore = typeof data.icp_fit_score === "number" ? data.icp_fit_score : null;
  const icpColor = icpScore !== null ? getIcpColor(icpScore) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Enrichment Insights
        </CardTitle>
        {enrichedAt && (
          <span className="text-xs text-muted-foreground">{formatDate(enrichedAt)}</span>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {/* ICP Fit Score */}
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
            {data.icp_fit_reason && (
              <p className="text-xs text-muted-foreground mt-2">{data.icp_fit_reason}</p>
            )}
          </div>
        )}

        {/* Company Overview Grid */}
        {(data.company_summary || data.industry || data.estimated_company_size || data.estimated_revenue) && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Company Overview
            </h4>
            {data.company_summary && (
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{data.company_summary}</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.industry && (
                <div className="p-2.5 rounded-lg bg-muted/30 border">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                    <Factory className="h-3 w-3" /> Industry
                  </span>
                  <p className="text-sm font-medium mt-1">{data.industry}</p>
                </div>
              )}
              {data.estimated_company_size && (
                <div className="p-2.5 rounded-lg bg-muted/30 border">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                    <Users className="h-3 w-3" /> Company Size
                  </span>
                  <p className="text-sm font-medium mt-1">{data.estimated_company_size}</p>
                </div>
              )}
              {data.estimated_revenue && (
                <div className="p-2.5 rounded-lg bg-muted/30 border">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Est. Revenue
                  </span>
                  <p className="text-sm font-medium mt-1">{data.estimated_revenue}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lead Role Analysis */}
        {(data.lead_role_analysis || data.seniority_level) && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-primary" /> Lead Role Analysis
            </h4>
            {data.seniority_level && (
              <Badge variant="outline" className="mb-2 text-xs">{data.seniority_level}</Badge>
            )}
            {data.lead_role_analysis && (
              <p className="text-sm text-muted-foreground leading-relaxed">{data.lead_role_analysis}</p>
            )}
          </div>
        )}

        {/* Pain Points */}
        {data.likely_pain_points && data.likely_pain_points.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Likely Pain Points
            </h4>
            <ul className="space-y-1.5">
              {data.likely_pain_points.map((point, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">-</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Automation Opportunities */}
        {data.ai_automation_opportunities && data.ai_automation_opportunities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-violet-500" /> AI Automation Opportunities
            </h4>
            <ul className="space-y-1.5">
              {data.ai_automation_opportunities.map((opp, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5 shrink-0">+</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Approach */}
        {data.recommended_approach && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <h4 className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary" /> Recommended Approach
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.recommended_approach}</p>
          </div>
        )}

        {/* Talking Points */}
        {data.talking_points && data.talking_points.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-primary" /> Talking Points
            </h4>
            <ul className="space-y-1.5">
              {data.talking_points.map((point, i) => (
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

function parseCompanyResearch(raw: string): CompanyResearchParsed | null {
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

function CompanyResearchCard({ companyResearch, researchedAt }: { companyResearch: string; researchedAt?: string }) {
  const data = useMemo(() => parseCompanyResearch(companyResearch), [companyResearch]);

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" /> Company Research
        </CardTitle>
        {researchedAt && (
          <span className="text-xs text-muted-foreground">{formatDate(researchedAt)}</span>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Company Overview */}
        {data.company_overview && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Company Overview
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.company_overview}</p>
          </div>
        )}

        {/* Products & Services */}
        {data.products_services && data.products_services.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-primary" /> Products & Services
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.products_services.map((item, i) => (
                <Badge key={i} variant="outline" className="text-xs">{item}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Target Market */}
        {data.target_market && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Crosshair className="h-3.5 w-3.5 text-primary" /> Target Market
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.target_market}</p>
          </div>
        )}

        {/* Competitors */}
        {data.competitors && data.competitors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-orange-500" /> Competitors
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.competitors.map((c, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tech Stack */}
        {data.tech_stack && data.tech_stack.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-violet-500" /> Tech Stack
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.tech_stack.map((t, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-violet-500/5 border-violet-500/20 text-violet-400">{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Growth Signals */}
        {data.growth_signals && data.growth_signals.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Growth Signals
            </h4>
            <ul className="space-y-1.5">
              {data.growth_signals.map((signal, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 shrink-0">+</span>
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent News */}
        {data.recent_news && data.recent_news.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Newspaper className="h-3.5 w-3.5 text-blue-500" /> Recent News
            </h4>
            <ul className="space-y-1.5">
              {data.recent_news.map((news, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5 shrink-0">&bull;</span>
                  <span>{news}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Company Culture */}
        {data.company_culture && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" /> Company Culture
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.company_culture}</p>
          </div>
        )}

        {/* Potential Challenges */}
        {data.potential_challenges && data.potential_challenges.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Potential Challenges
            </h4>
            <ul className="space-y-1.5">
              {data.potential_challenges.map((challenge, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">-</span>
                  <span>{challenge}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strategic Recommendations */}
        {data.strategic_recommendations && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <h4 className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary" /> Strategic Recommendations
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.strategic_recommendations}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface LeadDetailCardProps {
  lead: Lead;
  onScore: () => Promise<void>;
  onGenerateOutreach: (type: string, tone: string) => Promise<any>;
  onScheduleCall: () => Promise<void>;
  onEnrich: () => Promise<void>;
  onResearch: () => Promise<void>;
}

export function LeadDetailCard({ lead, onScore, onGenerateOutreach, onScheduleCall, onEnrich, onResearch }: LeadDetailCardProps) {
  const [scoring, setScoring] = useState(false);
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [outreachResult, setOutreachResult] = useState<{ subject?: string; message: string } | null>(null);
  const [schedulingCall, setSchedulingCall] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [researching, setResearching] = useState(false);

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

  const handleGenerateOutreach = async (type: string) => {
    setGeneratingOutreach(true);
    try {
      const result = await onGenerateOutreach(type, "professional");
      setOutreachResult(result);
    } catch {
      toast.error("Failed to generate outreach");
    } finally {
      setGeneratingOutreach(false);
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
      toast.success("Lead enriched!");
    } catch {
      toast.error("Failed to enrich lead");
    } finally {
      setEnriching(false);
    }
  };

  const handleResearch = async () => {
    setResearching(true);
    try {
      await onResearch();
      toast.success("Company researched!");
    } catch {
      toast.error("Failed to research company");
    } finally {
      setResearching(false);
    }
  };

  const copyOutreach = () => {
    if (outreachResult) {
      const text = outreachResult.subject
        ? `Subject: ${outreachResult.subject}\n\n${outreachResult.message}`
        : outreachResult.message;
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
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
            <Button size="sm" variant="outline" onClick={() => handleGenerateOutreach("email")} disabled={generatingOutreach}>
              {generatingOutreach ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Mail className="h-3.5 w-3.5 mr-1" />}
              Generate Email
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleGenerateOutreach("linkedin")} disabled={generatingOutreach}>
              <Linkedin className="h-3.5 w-3.5 mr-1" /> LinkedIn Message
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleGenerateOutreach("sms")} disabled={generatingOutreach}>
              <MessageSquare className="h-3.5 w-3.5 mr-1" /> SMS
            </Button>
            <Button size="sm" variant="outline" onClick={handleScheduleCall} disabled={schedulingCall}>
              {schedulingCall ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <PhoneCall className="h-3.5 w-3.5 mr-1" />}
              Schedule Vapi Call
            </Button>
            <Button size="sm" variant="outline" onClick={handleEnrich} disabled={enriching}>
              {enriching ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Enrich Lead
            </Button>
            <Button size="sm" variant="outline" onClick={handleResearch} disabled={researching || !lead.company}>
              {researching ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Search className="h-3.5 w-3.5 mr-1" />}
              Research Company
            </Button>
          </div>

          {outreachResult && (
            <div className="mt-4 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Generated Message</span>
                <Button size="sm" variant="ghost" onClick={copyOutreach}>Copy</Button>
              </div>
              {outreachResult.subject && (
                <p className="text-sm font-medium mb-1">Subject: {outreachResult.subject}</p>
              )}
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{outreachResult.message}</p>
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

      {/* Enrichment Data */}
      {lead.enrichmentData && <EnrichmentDataCard enrichmentData={lead.enrichmentData} enrichedAt={lead.enrichedAt} />}

      {/* Company Research */}
      {lead.companyResearch && <CompanyResearchCard companyResearch={lead.companyResearch} researchedAt={lead.researchedAt} />}

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

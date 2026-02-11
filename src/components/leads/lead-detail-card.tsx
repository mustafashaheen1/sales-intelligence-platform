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
  CheckCircle2, AlertCircle, ArrowRight, Calendar,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LeadDetailCardProps {
  lead: Lead;
  onScore: () => Promise<void>;
  onGenerateOutreach: (type: string, tone: string) => Promise<any>;
  onScheduleCall: () => Promise<void>;
}

export function LeadDetailCard({ lead, onScore, onGenerateOutreach, onScheduleCall }: LeadDetailCardProps) {
  const [scoring, setScoring] = useState(false);
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [outreachResult, setOutreachResult] = useState<{ subject?: string; message: string } | null>(null);
  const [schedulingCall, setSchedulingCall] = useState(false);

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

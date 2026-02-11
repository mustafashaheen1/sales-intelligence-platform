"use client";

import { useParams, useRouter } from "next/navigation";
import { useLead } from "@/hooks/use-leads";
import { useActivities } from "@/hooks/use-activities";
import { LeadDetailCard } from "@/components/leads/lead-detail-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Phone, Calendar, FileText, RotateCw, StickyNote } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { ActivityType } from "@/types";
import { toast } from "sonner";

const activityIcons: Record<ActivityType, React.ElementType> = {
  "Email Sent": Mail,
  "Call Made": Phone,
  "Meeting Scheduled": Calendar,
  "Proposal Sent": FileText,
  "Follow Up": RotateCw,
  "Note Added": StickyNote,
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { lead, loading, refetch, setLead } = useLead(params.id as string);
  const { activities, loading: activitiesLoading } = useActivities(params.id as string);

  const handleScore = async () => {
    const res = await fetch(`/api/leads/${params.id}/score`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to score");
    const data = await res.json();
    setLead(data.lead);
  };

  const handleGenerateOutreach = async (type: string, tone: string) => {
    const res = await fetch(`/api/leads/${params.id}/outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, tone }),
    });
    if (!res.ok) throw new Error("Failed to generate");
    return res.json();
  };

  const handleScheduleCall = async () => {
    if (!lead?.phone) {
      toast.error("No phone number available for this lead");
      throw new Error("No phone");
    }
    const res = await fetch("/api/vapi/schedule-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: lead.phone,
        leadName: lead.name,
        leadCompany: lead.company,
        leadId: lead.id,
      }),
    });
    if (!res.ok) throw new Error("Failed to schedule call");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">Lead not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/leads")}>
          Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/leads")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
          <p className="text-muted-foreground text-sm">{lead.company || "No company"} {lead.title ? `- ${lead.title}` : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LeadDetailCard
            lead={lead}
            onScore={handleScore}
            onGenerateOutreach={handleGenerateOutreach}
            onScheduleCall={handleScheduleCall}
          />
        </div>

        <div className="space-y-6">
          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4">
                    {activities.map((activity) => {
                      const Icon = activityIcons[activity.activityType] || StickyNote;
                      return (
                        <div key={activity.id} className="flex items-start gap-3 relative">
                          <div className="h-6 w-6 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center shrink-0 z-10">
                            <Icon className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0 pb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{activity.activityType}</span>
                              {activity.outcome && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {activity.outcome}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.description}</p>
                            <span className="text-[10px] text-muted-foreground/60">{formatRelativeDate(activity.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No activities yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

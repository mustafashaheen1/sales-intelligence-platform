"use client";

import { useActivities } from "@/hooks/use-activities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Phone, Calendar, FileText, RotateCw, StickyNote } from "lucide-react";
import { ActivityType } from "@/types";

const activityIcons: Record<ActivityType, React.ElementType> = {
  "Email Sent": Mail,
  "Call Made": Phone,
  "Meeting Scheduled": Calendar,
  "Proposal Sent": FileText,
  "Follow Up": RotateCw,
  "Note Added": StickyNote,
};

const outcomeColors: Record<string, string> = {
  Positive: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  Negative: "bg-red-500/10 text-red-500 border-red-500/20",
  "No Response": "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export function RecentActivity() {
  const { activities, loading } = useActivities();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 8).map((activity) => {
            const Icon = activityIcons[activity.activityType] || StickyNote;
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{activity.leadName || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{activity.activityType}</span>
                    {activity.outcome && (
                      <Badge variant="outline" className={outcomeColors[activity.outcome]}>
                        {activity.outcome}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{activity.description}</p>
                  <span className="text-[11px] text-muted-foreground/70">{formatRelativeDate(activity.createdAt)}</span>
                </div>
              </div>
            );
          })}
          {activities.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

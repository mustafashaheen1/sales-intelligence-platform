"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDate } from "@/lib/utils";
import { Phone, PhoneCall, PhoneOff, PhoneMissed, Clock, CheckCircle2, Calendar } from "lucide-react";
import { VapiCall } from "@/types";

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  Scheduled: { icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  "No Answer": { icon: PhoneMissed, color: "text-amber-500", bg: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  "Not Called": { icon: PhoneOff, color: "text-slate-400", bg: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  "Callback Requested": { icon: Phone, color: "text-purple-500", bg: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
};

function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<VapiCall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vapi/calls")
      .then((res) => res.json())
      .then((data) => setCalls(data.calls || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const scheduledCalls = calls.filter((c) => c.status === "Scheduled");
  const completedCalls = calls.filter((c) => c.status !== "Scheduled");

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Voice AI Calls</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage Vapi-powered qualification calls</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-500">Vapi Connected</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{scheduledCalls.length}</p>
              <p className="text-xs text-muted-foreground">Upcoming Calls</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCalls.filter((c) => c.status === "Completed").length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatDuration(
                  Math.round(
                    completedCalls.reduce((acc, c) => acc + (c.duration || 0), 0) / Math.max(completedCalls.filter((c) => c.duration).length, 1)
                  )
                )}
              </p>
              <p className="text-xs text-muted-foreground">Avg Duration</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Calls */}
      {scheduledCalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" /> Upcoming Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <PhoneCall className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{call.leadName}</p>
                      <p className="text-xs text-muted-foreground">
                        Scheduled: {call.scheduledAt ? formatDate(call.scheduledAt) : "TBD"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    Scheduled
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call History</CardTitle>
        </CardHeader>
        <CardContent>
          {completedCalls.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No call history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedCalls.map((call) => {
                const config = statusConfig[call.status] || statusConfig["Not Called"];
                const StatusIcon = config.icon;
                return (
                  <div key={call.id} className="p-4 rounded-lg border hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn("h-9 w-9 rounded-full flex items-center justify-center", config.color.replace("text-", "bg-").replace("500", "500/10"))}>
                          <StatusIcon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{call.leadName}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground">{formatDate(call.completedAt || call.scheduledAt)}</span>
                            {call.duration ? (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {formatDuration(call.duration)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {call.outcome && (
                          <span className="text-xs text-muted-foreground">{call.outcome}</span>
                        )}
                        <Badge variant="outline" className={cn("text-xs", config.bg)}>
                          {call.status}
                        </Badge>
                      </div>
                    </div>
                    {call.summary && (
                      <p className="text-sm text-muted-foreground mt-2 ml-12">{call.summary}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

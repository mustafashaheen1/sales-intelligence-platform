"use client";

import { Users, Flame, Thermometer, Snowflake, TrendingUp, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnalyticsOverview } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  data: AnalyticsOverview | null;
  loading: boolean;
}

const stats = [
  { key: "totalLeads" as const, label: "Total Leads", icon: Users, color: "text-primary", bg: "bg-primary/10" },
  { key: "hotLeads" as const, label: "Hot Leads", icon: Flame, color: "text-red-500", bg: "bg-red-500/10" },
  { key: "warmLeads" as const, label: "Warm Leads", icon: Thermometer, color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "coldLeads" as const, label: "Cold Leads", icon: Snowflake, color: "text-blue-500", bg: "bg-blue-500/10" },
  { key: "conversionRate" as const, label: "Conversion Rate", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", suffix: "%" },
  { key: "callsScheduledToday" as const, label: "Calls Scheduled", icon: Phone, color: "text-purple-500", bg: "bg-purple-500/10" },
];

export function StatsCards({ data, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, i) => (
        <Card key={stat.key} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                {data ? data[stat.key] : 0}
              </span>
              {stat.suffix && <span className="text-sm text-muted-foreground">{stat.suffix}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useAnalyticsOverview, usePipelineData } from "@/hooks/use-analytics";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: overview, loading: overviewLoading } = useAnalyticsOverview();
  const { data: pipeline, loading: pipelineLoading } = usePipelineData();
  const router = useRouter();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back. Here&apos;s your sales intelligence overview.</p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          AI Powered
        </Badge>
      </div>

      <StatsCards data={overview} loading={overviewLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PipelineChart data={pipeline} loading={pipelineLoading} />
        </div>
        <QuickActions onAddLead={() => router.push("/leads?add=true")} />
      </div>

      <RecentActivity />
    </div>
  );
}

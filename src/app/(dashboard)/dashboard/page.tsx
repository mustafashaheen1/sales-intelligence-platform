"use client";

import { useState, useRef } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useAnalyticsOverview, usePipelineData } from "@/hooks/use-analytics";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: overview, loading: overviewLoading, error: overviewError } = useAnalyticsOverview();
  const { data: pipeline, loading: pipelineLoading } = usePipelineData();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/leads/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Import failed");
      }

      toast.success(`Imported ${json.imported} lead${json.imported !== 1 ? "s" : ""} successfully!`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import CSV");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back. Here&apos;s your sales intelligence overview.</p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          AI Powered
        </Badge>
      </div>

      <StatsCards data={overview} loading={overviewLoading} error={overviewError} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PipelineChart data={pipeline} loading={pipelineLoading} />
        </div>
        <QuickActions
          onAddLead={() => router.push("/leads?add=true")}
          onImport={handleImportClick}
          importing={importing}
        />
      </div>

      <RecentActivity />
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsOverview, usePipelineData, useSourceData } from "@/hooks/use-analytics";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, Legend, Area, AreaChart,
} from "recharts";
import { BarChart3, PieChartIcon, TrendingUp, Target } from "lucide-react";

const PIPELINE_COLORS: Record<string, string> = {
  New: "#94a3b8",
  Contacted: "#3b82f6",
  Qualified: "#10b981",
  Proposal: "#8b5cf6",
  Won: "#22c55e",
  Lost: "#ef4444",
};

const SOURCE_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

const SCORE_DISTRIBUTION = [
  { name: "Hot (70-100)", value: 0, color: "#ef4444" },
  { name: "Warm (40-69)", value: 0, color: "#f59e0b" },
  { name: "Cold (0-39)", value: 0, color: "#3b82f6" },
];

const WEEKLY_TREND = [
  { week: "Week 1", leads: 3, conversions: 0 },
  { week: "Week 2", leads: 5, conversions: 1 },
  { week: "Week 3", leads: 4, conversions: 0 },
  { week: "Week 4", leads: 6, conversions: 1 },
  { week: "Week 5", leads: 8, conversions: 2 },
  { week: "Week 6", leads: 7, conversions: 1 },
];

export default function AnalyticsPage() {
  const { data: overview, loading: overviewLoading } = useAnalyticsOverview();
  const { data: pipeline, loading: pipelineLoading } = usePipelineData();
  const { data: sources, loading: sourcesLoading } = useSourceData();

  const scoreDistribution = overview
    ? [
        { name: "Hot (70-100)", value: overview.hotLeads, color: "#ef4444" },
        { name: "Warm (40-69)", value: overview.warmLeads, color: "#f59e0b" },
        { name: "Cold (0-39)", value: overview.coldLeads, color: "#3b82f6" },
      ]
    : SCORE_DISTRIBUTION;

  const funnelData = pipeline.length > 0
    ? [
        { stage: "Total Leads", value: overview?.totalLeads || 0 },
        { stage: "Contacted", value: pipeline.find((p) => p.status === "Contacted")?.count || 0 },
        { stage: "Qualified", value: pipeline.find((p) => p.status === "Qualified")?.count || 0 },
        { stage: "Proposal", value: pipeline.find((p) => p.status === "Proposal")?.count || 0 },
        { stage: "Won", value: pipeline.find((p) => p.status === "Won")?.count || 0 },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your sales performance and pipeline health</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {overviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">{overview?.totalLeads || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Leads</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-emerald-500">{overview?.conversionRate || 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">Conversion Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-500">{overview?.hotLeads || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Hot Leads</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-amber-500">{overview?.callsScheduledToday || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Calls Scheduled</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" /> Lead Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-[280px]" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Leads by Source - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Leads by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sourcesLoading ? (
              <Skeleton className="h-[280px]" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sources} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="source" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {sources.map((_, index) => (
                      <Cell key={index} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pipelineLoading ? (
              <Skeleton className="h-[280px]" />
            ) : (
              <div className="space-y-3">
                {funnelData.map((item, i) => {
                  const maxValue = funnelData[0]?.value || 1;
                  const width = Math.max((item.value / maxValue) * 100, 8);
                  return (
                    <div key={item.stage} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.stage}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                      <div className="h-8 bg-muted/30 rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all duration-500 flex items-center justify-center text-xs font-medium text-white"
                          style={{
                            width: `${width}%`,
                            backgroundColor: ["#6366f1", "#3b82f6", "#10b981", "#8b5cf6", "#22c55e"][i],
                          }}
                        >
                          {item.value > 0 && item.value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Weekly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={WEEKLY_TREND} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="leads" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="conversions" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {pipelineLoading ? (
            <Skeleton className="h-[300px]" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipeline} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="status" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {pipeline.map((entry) => (
                    <Cell key={entry.status} fill={PIPELINE_COLORS[entry.status] || "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

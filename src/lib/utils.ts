import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreLabel(score: number): "Hot 🔥" | "Warm 🌡️" | "Cold ❄️" {
  if (score >= 70) return "Hot 🔥";
  if (score >= 40) return "Warm 🌡️";
  return "Cold ❄️";
}

export function getScoreColor(score: number): string {
  if (score >= 70) return "text-red-500";
  if (score >= 40) return "text-amber-500";
  return "text-blue-500";
}

export function getScoreBgColor(score: number): string {
  if (score >= 70) return "bg-red-500/10 text-red-500 border-red-500/20";
  if (score >= 40) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return "bg-blue-500/10 text-blue-500 border-blue-500/20";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    New: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    Contacted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Qualified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Proposal: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Won: "bg-green-500/10 text-green-400 border-green-500/20",
    Lost: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return colors[status] || colors.New;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date: string | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(date: string | undefined): string {
  if (!date) return "—";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

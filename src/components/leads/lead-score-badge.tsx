"use client";

import { cn } from "@/lib/utils";

interface LeadScoreBadgeProps {
  score?: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function LeadScoreBadge({ score, label, size = "md" }: LeadScoreBadgeProps) {
  if (score === undefined) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Not scored</span>
      </div>
    );
  }

  const getColor = () => {
    if (score >= 70) return { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20", ring: "ring-red-500/20" };
    if (score >= 40) return { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", ring: "ring-amber-500/20" };
    return { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", ring: "ring-blue-500/20" };
  };

  const colors = getColor();
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        colors.bg, colors.text, colors.border,
        sizeClasses[size]
      )}>
        {score}
      </span>
      {label && <span className={cn("text-xs font-medium", colors.text)}>{label}</span>}
    </div>
  );
}

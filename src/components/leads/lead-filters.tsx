"use client";

import { Select, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface LeadFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  scoreLabel: string;
  onScoreLabelChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  source: string;
  onSourceChange: (value: string) => void;
  onClear: () => void;
}

export function LeadFilters({
  search, onSearchChange,
  scoreLabel, onScoreLabelChange,
  status, onStatusChange,
  source, onSourceChange,
  onClear,
}: LeadFiltersProps) {
  const hasFilters = search || scoreLabel || status || source;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={scoreLabel} onValueChange={onScoreLabelChange} placeholder="Score">
        <SelectItem value="">All Scores</SelectItem>
        <SelectItem value="Hot 🔥">Hot 🔥</SelectItem>
        <SelectItem value="Warm 🌡️">Warm 🌡️</SelectItem>
        <SelectItem value="Cold ❄️">Cold ❄️</SelectItem>
      </Select>
      <Select value={status} onValueChange={onStatusChange} placeholder="Status">
        <SelectItem value="">All Status</SelectItem>
        <SelectItem value="New">New</SelectItem>
        <SelectItem value="Contacted">Contacted</SelectItem>
        <SelectItem value="Qualified">Qualified</SelectItem>
        <SelectItem value="Proposal">Proposal</SelectItem>
        <SelectItem value="Won">Won</SelectItem>
        <SelectItem value="Lost">Lost</SelectItem>
      </Select>
      <Select value={source} onValueChange={onSourceChange} placeholder="Source">
        <SelectItem value="">All Sources</SelectItem>
        <SelectItem value="Website">Website</SelectItem>
        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
        <SelectItem value="Referral">Referral</SelectItem>
        <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
        <SelectItem value="Event">Event</SelectItem>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

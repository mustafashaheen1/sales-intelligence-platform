"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLeads } from "@/hooks/use-leads";
import { LeadTable } from "@/components/leads/lead-table";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadForm } from "@/components/leads/lead-form";
import { Button } from "@/components/ui/button";
import { UserPlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Lead } from "@/types";

function LeadsContent() {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [scoreLabel, setScoreLabel] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");

  const { leads, loading, createLead, deleteLead, scoreLead, refetch } = useLeads({
    search: search || undefined,
    scoreLabel: scoreLabel || undefined,
    status: status || undefined,
    source: source || undefined,
  });

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setShowForm(true);
    }
  }, [searchParams]);

  const handleCreate = async (data: Partial<Lead>) => {
    await createLead(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await deleteLead(id);
      toast.success("Lead deleted");
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  const handleScore = async (id: string) => {
    toast.info("Scoring lead with AI...");
    try {
      await scoreLead(id);
      toast.success("Lead scored!");
    } catch {
      toast.error("Failed to score lead");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setScoreLabel("");
    setStatus("");
    setSource("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {leads.length} lead{leads.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <LeadFilters
        search={search} onSearchChange={setSearch}
        scoreLabel={scoreLabel} onScoreLabelChange={setScoreLabel}
        status={status} onStatusChange={setStatus}
        source={source} onSourceChange={setSource}
        onClear={clearFilters}
      />

      <LeadTable
        leads={leads}
        loading={loading}
        onDelete={handleDelete}
        onScore={handleScore}
      />

      <LeadForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleCreate}
      />
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense>
      <LeadsContent />
    </Suspense>
  );
}

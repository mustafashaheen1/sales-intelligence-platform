"use client";

import { useState, useEffect, useCallback } from "react";
import { Lead } from "@/types";

interface UseLeadsOptions {
  search?: string;
  scoreLabel?: string;
  status?: string;
  source?: string;
}

export function useLeads(options?: UseLeadsOptions) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options?.search) params.set("search", options.search);
      if (options?.scoreLabel) params.set("scoreLabel", options.scoreLabel);
      if (options?.status) params.set("status", options.status);
      if (options?.source) params.set("source", options.source);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [options?.search, options?.scoreLabel, options?.status, options?.source]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const createLead = async (data: Partial<Lead>) => {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create lead");
    const result = await res.json();
    await fetchLeads();
    return result.lead;
  };

  const updateLead = async (id: string, data: Partial<Lead>) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update lead");
    const result = await res.json();
    setLeads((prev) => prev.map((l) => (l.id === id ? result.lead : l)));
    return result.lead;
  };

  const deleteLead = async (id: string) => {
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete lead");
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const scoreLead = async (id: string) => {
    const res = await fetch(`/api/leads/${id}/score`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to score lead");
    const result = await res.json();
    setLeads((prev) => prev.map((l) => (l.id === id ? result.lead : l)));
    return result.lead;
  };

  const generateOutreach = async (id: string, type: string, tone: string) => {
    const res = await fetch(`/api/leads/${id}/outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, tone }),
    });
    if (!res.ok) throw new Error("Failed to generate outreach");
    return res.json();
  };

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    scoreLead,
    generateOutreach,
  };
}

export function useLead(id: string) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLead = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) throw new Error("Lead not found");
      const data = await res.json();
      setLead(data.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchLead();
  }, [id, fetchLead]);

  return { lead, loading, error, refetch: fetchLead, setLead };
}

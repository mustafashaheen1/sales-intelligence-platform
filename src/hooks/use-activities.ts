"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity } from "@/types";

export function useActivities(leadId?: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const url = leadId ? `/api/activities/lead/${leadId}` : "/api/activities";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch activities");
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const createActivity = async (data: Partial<Activity>) => {
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create activity");
    const result = await res.json();
    setActivities((prev) => [result.activity, ...prev]);
    return result.activity;
  };

  return { activities, loading, refetch: fetchActivities, createActivity };
}

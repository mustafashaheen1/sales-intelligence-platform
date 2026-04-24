"use client";

import { useState, useEffect } from "react";
import { AnalyticsOverview, PipelineData, SourceData } from "@/types";

export function useAnalyticsOverview() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/overview")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || "Failed to fetch analytics");
        }
        return json;
      })
      .then(setData)
      .catch((err) => {
        console.error("Analytics overview error:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function usePipelineData() {
  const [data, setData] = useState<PipelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/pipeline")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || "Failed to fetch pipeline");
        }
        return json;
      })
      .then((d) => setData(d.pipeline || []))
      .catch((err) => {
        console.error("Pipeline data error:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

export function useSourceData() {
  const [data, setData] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/sources")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || "Failed to fetch sources");
        }
        return json;
      })
      .then((d) => setData(d.sources || []))
      .catch((err) => {
        console.error("Source data error:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

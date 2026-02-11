"use client";

import { useState, useEffect } from "react";
import { AnalyticsOverview, PipelineData, SourceData } from "@/types";

export function useAnalyticsOverview() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/overview")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function usePipelineData() {
  const [data, setData] = useState<PipelineData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/pipeline")
      .then((res) => res.json())
      .then((d) => setData(d.pipeline || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useSourceData() {
  const [data, setData] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/sources")
      .then((res) => res.json())
      .then((d) => setData(d.sources || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

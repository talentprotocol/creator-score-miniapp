"use client";

import { useState, useEffect } from "react";
import { BasecampStats } from "@/lib/types/basecamp";

interface UseBasecampStatsReturn {
  stats: BasecampStats | null;
  loading: boolean;
  error: string | null;
}

export function useBasecampStats(): UseBasecampStatsReturn {
  const [stats, setStats] = useState<BasecampStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/basecamp-stats");
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching basecamp stats:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}

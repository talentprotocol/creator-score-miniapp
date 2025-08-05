"use client";

import { useState, useEffect, useCallback } from "react";
import type { LeaderboardEntry } from "@/app/services/types";

export interface UseLeaderboardOptimizedReturn {
  entries: LeaderboardEntry[];
  loading: boolean;
  rewardsLoading: boolean;
  error: string | null;
  boostedCreatorsCount?: number;
  lastUpdated?: string | null;
  nextUpdate?: string | null;
  refetch: () => void;
}

export function useLeaderboardOptimized(
  page: number = 1,
  perPage: number = 200,
): UseLeaderboardOptimizedReturn {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boostedCreatorsCount, setBoostedCreatorsCount] = useState<
    number | undefined
  >(undefined);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [nextUpdate, setNextUpdate] = useState<string | null>(null);

  // Phase 1: Load basic data immediately
  const loadBasicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/leaderboard/basic?page=${page}&per_page=${perPage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard data: ${response.status}`);
      }

      const data = await response.json();

      setEntries(data.entries);
      setBoostedCreatorsCount(data.boostedCreatorsCount);
      setLastUpdated(data.lastUpdated);
      setNextUpdate(data.nextUpdate);
    } catch (err) {
      console.error(`❌ [LEADERBOARD HOOK] Failed to load basic data:`, err);
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard",
      );
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  const refetch = useCallback(() => {
    loadBasicData();
  }, [loadBasicData]);

  // Load basic data on mount or when params change
  useEffect(() => {
    loadBasicData();
  }, [loadBasicData]);

  return {
    entries,
    loading,
    rewardsLoading,
    error,
    boostedCreatorsCount,
    lastUpdated,
    nextUpdate,
    refetch,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { getLeaderboardCreators } from "@/app/services/leaderboardService";
import type { LeaderboardEntry } from "@/app/services/types";

export interface UseLeaderboardOptimizedReturn {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  boostedCreatorsCount?: number;
  tokenDataAvailable?: boolean;
  lastUpdated?: string | null;
  nextUpdate?: string | null;
  refetch: () => void;
}

export function useLeaderboardOptimized(
  page: number = 1,
  perPage: number = 25,
): UseLeaderboardOptimizedReturn {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boostedCreatorsCount, setBoostedCreatorsCount] = useState<
    number | undefined
  >(undefined);
  const [tokenDataAvailable, setTokenDataAvailable] = useState<
    boolean | undefined
  >(undefined);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [nextUpdate, setNextUpdate] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getLeaderboardCreators(page, perPage);

      setEntries(response.entries);
      setBoostedCreatorsCount(response.boostedCreatorsCount);
      setTokenDataAvailable(response.tokenDataAvailable);
      setLastUpdated(response.lastUpdated || null);
      setNextUpdate(response.nextUpdate || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard",
      );
    } finally {
      setLoading(false);
    }
  }, [page, perPage]);

  const refetch = useCallback(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return {
    entries,
    loading,
    error,
    boostedCreatorsCount,
    tokenDataAvailable,
    lastUpdated,
    nextUpdate,
    refetch,
  };
}

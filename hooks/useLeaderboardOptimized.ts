"use client";

import { useState, useEffect, useCallback } from "react";
import type { LeaderboardEntry } from "@/app/services/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { CACHE_KEYS } from "@/lib/cache-keys";

export interface UseLeaderboardOptimizedReturn {
  entries: LeaderboardEntry[];
  loading: boolean;
  rewardsLoading: boolean;
  error: string | null;
  boostedCreatorsCount?: number;
  lastUpdated?: string | null;
  nextUpdate?: string | null;
  activeCreatorsTotal?: number | null;
  refetch: () => void;
}

export function useLeaderboardData(): UseLeaderboardOptimizedReturn {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCreatorsTotal, setActiveCreatorsTotal] = useState<number | null>(
    null,
  );
  const [boostedCreatorsCount, setBoostedCreatorsCount] = useState<
    number | undefined
  >(undefined);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [nextUpdate, setNextUpdate] = useState<string | null>(null);

  // Load basic data immediately
  const loadBasicData = useCallback(async () => {
    // Check cache first
    const cacheKey = CACHE_KEYS.LEADERBOARD_BASIC;
    const cachedData = getCachedData<{
      entries: LeaderboardEntry[];
      boostedCreatorsCount: number;
      lastUpdated: string | null;
      nextUpdate: string | null;
    }>(cacheKey, CACHE_DURATIONS.LEADERBOARD_DATA);

    if (cachedData) {
      setEntries(cachedData.entries);
      setBoostedCreatorsCount(cachedData.boostedCreatorsCount);
      setLastUpdated(cachedData.lastUpdated);
      setNextUpdate(cachedData.nextUpdate);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leaderboard/basic`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard data: ${response.status}`);
      }

      const data = await response.json();

      setEntries(data.entries);
      setBoostedCreatorsCount(data.boostedCreatorsCount);
      setLastUpdated(data.lastUpdated);
      setNextUpdate(data.nextUpdate);

      // Cache the data
      setCachedData(cacheKey, {
        entries: data.entries,
        boostedCreatorsCount: data.boostedCreatorsCount,
        lastUpdated: data.lastUpdated,
        nextUpdate: data.nextUpdate,
      });
    } catch (err) {
      console.error(`Failed to load leaderboard data:`, err);
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    loadBasicData();
  }, [loadBasicData]);

  // Load basic data on mount
  useEffect(() => {
    loadBasicData();
  }, [loadBasicData]);

  // Fetch total active creators (Creator Score > 0) once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/leaderboard/active-creators-count");
        if (!res.ok) throw new Error("Failed to fetch count");
        const json = await res.json();
        if (!cancelled) setActiveCreatorsTotal(json.total ?? null);
      } catch {
        if (!cancelled) setActiveCreatorsTotal(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    entries,
    loading,
    rewardsLoading,
    error,
    boostedCreatorsCount,
    lastUpdated,
    nextUpdate,
    activeCreatorsTotal,
    refetch,
  };
}

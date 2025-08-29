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
  activeCreatorsTotal?: number | null;
  refetch: (forceFresh?: boolean) => void;
  updateUserOptOutStatus: (talentUuid: string, isOptedOut: boolean) => void;
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

  // Filter out entries with rank > 200 only
  const filterValidEntries = useCallback(
    (rawEntries: LeaderboardEntry[]): LeaderboardEntry[] => {
      return rawEntries.filter((entry) => {
        // Skip entries with rank > 200
        if (!entry.rank || entry.rank > 200) return false;

        // Don't filter out opted-out users - they should show their donated amount
        return true;
      });
    },
    [],
  );

  // Load basic data immediately
  const loadBasicData = useCallback(async () => {
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

      // Filter out entries with rank > 200 only
      const filteredEntries = filterValidEntries(data.entries);

      setEntries(filteredEntries);
      setBoostedCreatorsCount(data.boostedCreatorsCount);
      setLastUpdated(data.lastUpdated);
      setNextUpdate(data.nextUpdate);
    } catch (err) {
      console.error(`Failed to load leaderboard data:`, err);
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(
    (forceFresh?: boolean) => {
      loadBasicData();
    },
    [loadBasicData],
  );

  const updateUserOptOutStatus = useCallback(
    (talentUuid: string, isOptedOut: boolean) => {
      if (!talentUuid) return;
      // Update in-memory state
      setEntries((prev) => {
        const updated = prev.map((e: LeaderboardEntry) =>
          String(e.talent_protocol_id) === String(talentUuid)
            ? { ...e, isOptedOut }
            : e,
        );
        return updated;
      });
    },
    [],
  );

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
    updateUserOptOutStatus,
  };
}

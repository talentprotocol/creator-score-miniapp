"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  LeaderboardEntry,
  LeaderboardData,
} from "@/lib/types/leaderboard";

interface UseLeaderboardDataReturn {
  entries: LeaderboardEntry[];
  loading: boolean;
  rewardsLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  nextUpdate: string | null;
  activeCreatorsTotal: number | null;
  refetch: (forceFresh?: boolean) => void;
  updateUserOptOutStatus: (talentUuid: string, isOptedOut: boolean) => void;
}

/**
 * CLIENT-SIDE ONLY: Fetches leaderboard data via API route (follows coding principles)
 */
async function getLeaderboardBasic(): Promise<LeaderboardData> {
  try {
    const response = await fetch(`/api/leaderboard/basic`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[useScoreLeaderboardData] Client-side fetch failed:", error);
    throw error;
  }
}

/**
 * CLIENT-SIDE ONLY: Fetches active creators count via API route (follows coding principles)
 */
async function getActiveCreatorsCount(): Promise<{ total: number }> {
  try {
    const response = await fetch("/api/leaderboard/active-creators-count");

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(
      "[useScoreLeaderboardData] Active creators count fetch failed:",
      error,
    );
    throw error;
  }
}

export function useScoreLeaderboardData(): UseLeaderboardDataReturn {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCreatorsTotal, setActiveCreatorsTotal] = useState<number | null>(
    null,
  );
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [nextUpdate, setNextUpdate] = useState<string | null>(null);

  // Filter out entries with rank > 200 only
  const filterValidEntries = useCallback(
    (rawEntries: LeaderboardEntry[]): LeaderboardEntry[] => {
      return rawEntries.filter((entry) => {
        // Skip entries with rank > 200
        if (entry.rank && entry.rank > 200) return false;

        // Don't filter out opted-out users - they should show their donated amount
        // Don't filter out entries with rank -1 (no rank available) - they should show "-"
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

      const data = await getLeaderboardBasic();

      // Filter out entries with rank > 200 only
      const filteredEntries = filterValidEntries(data.entries);

      setEntries(filteredEntries);
      setLastUpdated(data.lastUpdated ?? null);
      setNextUpdate(data.nextUpdate ?? null);
    } catch (err) {
      console.error(`Failed to load leaderboard data:`, err);
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard",
      );
    } finally {
      setLoading(false);
    }
  }, [filterValidEntries]);

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
        const data = await getActiveCreatorsCount();
        if (!cancelled) setActiveCreatorsTotal(data.total ?? null);
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
    lastUpdated,
    nextUpdate,
    activeCreatorsTotal,
    refetch,
    updateUserOptOutStatus,
  };
}

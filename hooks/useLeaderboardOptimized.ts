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
  refetch: (forceFresh?: boolean) => void;
  updateUserOptOutStatus: (talentUuid: string, isOptedOut: boolean) => void;
}

/**
 * CLIENT-SIDE ONLY: Fetches leaderboard data via API route (follows coding principles)
 */
async function getLeaderboardBasic(): Promise<LeaderboardData> {
  try {
    // Add cache-busting timestamp to prevent browser caching
    const timestamp = Date.now();
    const response = await fetch(`/api/leaderboard/basic?t=${timestamp}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[useLeaderboardOptimized] Client-side fetch failed:", error);
    throw error;
  }
}

export function useLeaderboardData(): UseLeaderboardDataReturn {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      // Always force fresh data when refetching
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

  // Load basic data on mount and refresh every 30 seconds to ensure fresh data
  useEffect(() => {
    loadBasicData();

    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(() => {
      loadBasicData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loadBasicData]);

  return {
    entries,
    loading,
    rewardsLoading,
    error,
    lastUpdated,
    nextUpdate,
    refetch,
    updateUserOptOutStatus,
  };
}

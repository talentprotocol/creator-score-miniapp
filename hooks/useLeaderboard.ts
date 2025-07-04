"use client";

import { useState, useEffect, useCallback } from "react";
import { getLeaderboardCreators } from "@/app/services/leaderboardService";
import type { LeaderboardEntry } from "@/app/services/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";

export function useLeaderboard(perPage: number = 10) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadInitialData = useCallback(async () => {
    const cacheKey = `leaderboard_page_1_${perPage}`;

    // Check cache first
    const cachedData = getCachedData<LeaderboardEntry[]>(
      cacheKey,
      CACHE_DURATIONS.PROFILE_DATA, // 5 minute cache for leaderboard
    );

    if (cachedData && cachedData.length > 0) {
      setEntries(cachedData);
      setPage(1);
      setHasMore(cachedData.length >= perPage);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getLeaderboardCreators({ page: 1, perPage });
      setEntries(data);
      setPage(1);
      setHasMore(data.length >= perPage);

      // Cache the initial data
      setCachedData(cacheKey, data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard",
      );
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [perPage]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const data = await getLeaderboardCreators({ page: nextPage, perPage });

      if (data.length === 0) {
        setHasMore(false);
        return;
      }

      // Combine previous and new entries
      const combined = [...entries, ...data];
      // Recalculate rank for all entries to handle ties properly
      const reRanked = combined.map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));

      setEntries(reRanked);
      setPage(nextPage);
      setHasMore(data.length >= perPage);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more entries",
      );
    } finally {
      setLoading(false);
    }
  }, [entries, page, perPage, loading, hasMore]);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const refresh = useCallback(() => {
    setEntries([]);
    setPage(1);
    setHasMore(true);
    loadInitialData();
  }, [loadInitialData]);

  return {
    entries,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

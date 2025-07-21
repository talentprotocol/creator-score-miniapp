"use client";

import { useState, useEffect, useCallback } from "react";
import type { LeaderboardEntry } from "@/app/services/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { getLeaderboardCreators } from "@/app/services/leaderboardService";

const CACHE_KEYS = {
  TOP_10: "leaderboard_top_10",
  TOP_200: "leaderboard_top_200",
  TOP_200_TOTAL_SCORES: "leaderboard_top_200_total_scores",
  STATS: "leaderboard_stats",
} as const;

interface LeaderboardStats {
  totalCreators: number;
  minScore: number;
  maxScore: number;
  avgScore: number;
}

interface UseLeaderboardOptimizedReturn {
  top10: LeaderboardEntry[];
  top200: LeaderboardEntry[];
  stats: LeaderboardStats | null;
  loading: {
    top10: boolean;
    top200: boolean;
    stats: boolean;
  };
  error: string | null;
  totalScores: number;
  refresh: () => void;
}

export function useLeaderboardOptimized(): UseLeaderboardOptimizedReturn {
  const [top10, setTop10] = useState<LeaderboardEntry[]>([]);
  const [top200, setTop200] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [totalScores, setTotalScores] = useState(0);
  const [loading, setLoading] = useState({
    top10: true,
    top200: true,
    stats: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Load top 10 - with aggressive caching
  const loadTop10 = useCallback(async () => {
    // Check cache first - 5 minute cache
    const cached = getCachedData<LeaderboardEntry[]>(
      CACHE_KEYS.TOP_10,
      CACHE_DURATIONS.PROFILE_DATA,
    );

    if (cached && cached.length > 0) {
      setTop10(cached);
      setLoading((prev) => ({ ...prev, top10: false }));
      return;
    }

    try {
      const data = await getLeaderboardCreators({ page: 1, perPage: 10 });
      setTop10(data);
      setCachedData(CACHE_KEYS.TOP_10, data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard",
      );
    } finally {
      setLoading((prev) => ({ ...prev, top10: false }));
    }
  }, []);

  // Load top 200 - with aggressive caching
  const loadTop200 = useCallback(async () => {
    // Check cache first - 30 minute cache
    const cachedEntries = getCachedData<LeaderboardEntry[]>(
      CACHE_KEYS.TOP_200,
      CACHE_DURATIONS.EXPENSIVE_COMPUTATION,
    );
    const cachedTotalScores = getCachedData<string>(
      CACHE_KEYS.TOP_200_TOTAL_SCORES,
      CACHE_DURATIONS.EXPENSIVE_COMPUTATION,
    );

    if (cachedEntries && cachedEntries.length === 200) {
      setTop200(cachedEntries);
      setTotalScores(
        cachedTotalScores
          ? parseInt(cachedTotalScores, 10)
          : cachedEntries.reduce((sum, entry) => sum + entry.score, 0),
      );
      setLoading((prev) => ({ ...prev, top200: false }));
      return;
    }

    try {
      const data = await getLeaderboardCreators({ page: 1, perPage: 200 });
      const totalScores = data.reduce((sum, entry) => sum + entry.score, 0);

      setTop200(data);
      setTotalScores(totalScores);

      // Cache the data
      setCachedData(CACHE_KEYS.TOP_200, data);
      setCachedData(CACHE_KEYS.TOP_200_TOTAL_SCORES, totalScores.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load top 200");
    } finally {
      setLoading((prev) => ({ ...prev, top200: false }));
    }
  }, []);

  // Calculate and cache stats
  const calculateStats = useCallback((entries: LeaderboardEntry[]) => {
    if (entries.length === 0) return null;

    const scores = entries.map((entry) => entry.score);
    const totalCreators = entries.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const avgScore =
      scores.reduce((sum, score) => sum + score, 0) / totalCreators;

    const calculatedStats = {
      totalCreators,
      minScore,
      maxScore,
      avgScore,
    };

    // Cache the stats
    setCachedData(CACHE_KEYS.STATS, calculatedStats);
    return calculatedStats;
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    // Check cache first
    const cachedStats = getCachedData<LeaderboardStats>(
      CACHE_KEYS.STATS,
      CACHE_DURATIONS.EXPENSIVE_COMPUTATION,
    );

    if (cachedStats) {
      setStats(cachedStats);
      setLoading((prev) => ({ ...prev, stats: false }));
      return;
    }

    // Stats will be calculated when top200 loads
    setLoading((prev) => ({ ...prev, stats: false }));
  }, []);

  // Update stats when top200 data changes
  useEffect(() => {
    if (top200.length > 0 && !stats) {
      const calculatedStats = calculateStats(top200);
      setStats(calculatedStats);
    }
  }, [top200.length, stats, calculateStats]);

  // Load data on mount
  useEffect(() => {
    loadTop10();
    loadTop200();
    loadStats();
  }, []);

  // Refresh function
  const refresh = useCallback(() => {
    // Clear cache
    localStorage.removeItem(CACHE_KEYS.TOP_10);
    localStorage.removeItem(CACHE_KEYS.TOP_200);
    localStorage.removeItem(CACHE_KEYS.TOP_200_TOTAL_SCORES);
    localStorage.removeItem(CACHE_KEYS.STATS);

    // Reset state
    setTop10([]);
    setTop200([]);
    setStats(null);
    setTotalScores(0);
    setError(null);
    setLoading({ top10: true, top200: true, stats: true });

    // Reload data
    loadTop10();
    loadTop200();
    loadStats();
  }, [loadTop10, loadTop200, loadStats]);

  return {
    top10,
    top200,
    stats,
    loading,
    error,
    totalScores,
    refresh,
  };
}

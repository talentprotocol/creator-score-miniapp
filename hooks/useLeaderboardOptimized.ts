"use client";

import { useState, useEffect, useCallback } from "react";
import type { LeaderboardEntry } from "@/app/services/types";
import { getLeaderboardCreators } from "@/app/services/leaderboardService";

interface LeaderboardStats {
  totalCreators: number;
  minScore: number;
  maxScore: number;
  avgScore: number;
}

interface UseLeaderboardOptimizedReturn {
  top200: LeaderboardEntry[];
  stats: LeaderboardStats | null;
  loading: {
    top200: boolean;
    stats: boolean;
  };
  error: string | null;
  totalScores: number;
  refresh: () => void;
}

export function useLeaderboardOptimized(): UseLeaderboardOptimizedReturn {
  const [top200, setTop200] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [totalScores, setTotalScores] = useState(0);
  const [loading, setLoading] = useState({
    top200: true,
    stats: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [alreadyFetching, setAlreadyFetching] = useState(false);

  // Load top 200 - with aggressive caching
  const loadLeaderboard = useCallback(async () => {
    if (alreadyFetching) return;
    setAlreadyFetching(true);
    try {
      console.log("loading leaderboard");
      const data = await getLeaderboardCreators({ page: 1, perPage: 200 });
      const totalScores = data.reduce((sum, entry) => sum + entry.score, 0);

      setTop200(data);
      setTotalScores(totalScores);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load top 200");
    } finally {
      setLoading((prev) => ({ ...prev, top200: false }));
      setAlreadyFetching(false);
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

    return calculatedStats;
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
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
    loadLeaderboard();
    loadStats();
  }, []);

  // Refresh function
  const refresh = useCallback(() => {
    // Reset state
    setTop200([]);
    setStats(null);
    setTotalScores(0);
    setError(null);
    setLoading({ top200: true, stats: true });

    // Reload data
    loadLeaderboard();
    loadStats();
  }, [loadLeaderboard, loadStats]);

  return {
    top200,
    stats,
    loading,
    error,
    totalScores,
    refresh,
  };
}

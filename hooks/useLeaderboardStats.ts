"use client";

import { useState, useEffect } from "react";
import { getLeaderboardStats } from "@/app/services/leaderboardService";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";

interface LeaderboardStats {
  minScore: number | null;
  totalCreators: number;
}

export function useLeaderboardStats() {
  const [stats, setStats] = useState<LeaderboardStats>({
    minScore: null,
    totalCreators: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      const cacheKey = "leaderboard_stats";

      // Check cache first
      const cachedStats = getCachedData<LeaderboardStats>(
        cacheKey,
        CACHE_DURATIONS.PROFILE_DATA, // 5 minute cache for stats
      );

      if (cachedStats) {
        setStats(cachedStats);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getLeaderboardStats();
        const newStats = {
          minScore: data.minScore,
          totalCreators: data.totalCreators,
        };

        setStats(newStats);

        // Cache the stats
        setCachedData(cacheKey, newStats);
      } catch (err) {
        console.error("Error fetching leaderboard stats:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch leaderboard stats",
        );
        setStats({ minScore: null, totalCreators: 0 });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}

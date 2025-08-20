"use client";

import { useState, useEffect } from "react";
import type { LeaderboardEntry } from "@/app/services/types";

export interface UseOptOutStatusReturn {
  isOptedOut: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to check opt-out status for any user (top 200 or not)
 *
 * For top 200 users: Uses cached leaderboard data (fast)
 * For non-top-200 users: Makes API call to get database status
 *
 * @param talentUuid - User's Talent Protocol UUID
 * @param userTop200Entry - User's entry from leaderboard (if in top 200)
 * @returns Opt-out status, loading state, and error state
 */
export function useOptOutStatus(
  talentUuid: string | null,
  userTop200Entry?: LeaderboardEntry,
): UseOptOutStatusReturn {
  const [separateOptOutStatus, setSeparateOptOutStatus] = useState<
    boolean | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is in top 200, use leaderboard data (fast path)
  const isInTop200 = Boolean(userTop200Entry);
  const top200OptOutStatus = userTop200Entry?.isOptedOut || false;

  // For non-top-200 users, fetch status separately
  useEffect(() => {
    if (!talentUuid || isInTop200) {
      // Clear any previous separate status when switching to top 200 user
      if (isInTop200 && separateOptOutStatus !== null) {
        setSeparateOptOutStatus(null);
        setError(null);
      }
      return;
    }

    const fetchOptOutStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/user-preferences/optout?talent_uuid=${talentUuid}`,
        );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: Failed to fetch opt-out status`,
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to get opt-out status");
        }

        setSeparateOptOutStatus(data.data?.rewards_optout || false);
      } catch (err) {
        console.error("Error fetching opt-out status:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setSeparateOptOutStatus(false); // Default to not opted out on error
      } finally {
        setLoading(false);
      }
    };

    fetchOptOutStatus();
  }, [talentUuid, isInTop200]);

  // Return combined status based on data source
  const isOptedOut = isInTop200
    ? top200OptOutStatus
    : separateOptOutStatus || false;

  return {
    isOptedOut,
    loading: loading && !isInTop200, // Only show loading for non-top-200 users
    error,
  };
}

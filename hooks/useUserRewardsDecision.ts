"use client";

import { useState, useEffect } from "react";
import type { LeaderboardEntry } from "@/app/services/types";
import type { RewardsDecision } from "@/lib/types/user-preferences";

export interface UseUserRewardsDecisionReturn {
  data: {
    isOptedOut: boolean;
    isOptedIn: boolean;
    hasMadeDecision: boolean;
    rewardsDecision: RewardsDecision;
  };
  loading: boolean;
  error: string | null;
}

/**
 * Hook to check rewards decision status for any user (top 200 or not)
 *
 * For top 200 users: Uses cached leaderboard data (fast)
 * For non-top-200 users: Makes API call to get database status
 *
 * @param talentUuid - User's Talent Protocol UUID
 * @param userTop200Entry - User's entry from leaderboard (if in top 200)
 * @returns Rewards decision status, loading state, and error state
 */
export function useUserRewardsDecision(
  talentUuid: string | null,
  userTop200Entry?: LeaderboardEntry,
): UseUserRewardsDecisionReturn {
  const [separateRewardsDecision, setSeparateRewardsDecision] =
    useState<RewardsDecision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is in top 200, use leaderboard data (fast path)
  const isInTop200 = Boolean(userTop200Entry);
  const top200OptOutStatus = userTop200Entry?.isOptedOut || false;

  // For non-top-200 users, fetch status separately
  useEffect(() => {
    if (!talentUuid || isInTop200) {
      // Clear any previous separate status when switching to top 200 user
      if (isInTop200 && separateRewardsDecision !== null) {
        setSeparateRewardsDecision(null);
        setError(null);
      }
      return;
    }

    const fetchRewardsDecision = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/user-preferences/optout?talent_uuid=${talentUuid}`,
        );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: Failed to fetch rewards decision status`,
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.error || "Failed to get rewards decision status",
          );
        }

        setSeparateRewardsDecision(data.data?.rewards_decision || null);
      } catch (err) {
        console.error("Error fetching rewards decision status:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setSeparateRewardsDecision(null); // Default to no decision on error
      } finally {
        setLoading(false);
      }
    };

    fetchRewardsDecision();
  }, [talentUuid, isInTop200]);

  // Return combined status based on data source
  const rewardsDecision: RewardsDecision = isInTop200
    ? top200OptOutStatus
      ? "opted_out"
      : "opted_in"
    : separateRewardsDecision || null;

  const isOptedOut = rewardsDecision === "opted_out";
  const isOptedIn = rewardsDecision === "opted_in";
  const hasMadeDecision = rewardsDecision !== null;

  return {
    data: {
      isOptedOut,
      isOptedIn,
      hasMadeDecision,
      rewardsDecision,
    },
    loading: loading && !isInTop200, // Only show loading for non-top-200 users
    error,
  };
}

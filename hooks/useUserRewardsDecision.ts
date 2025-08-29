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

  // Check if we should use cached leaderboard data
  const isInTop200 = Boolean(userTop200Entry);

  // TODO: Add snapshot logic when LeaderboardSnapshotService is implemented
  // const shouldUseSnapshot = LeaderboardSnapshotService.shouldUseSnapshot();
  const shouldUseSnapshot = false; // Placeholder for testing

  // Priority order:
  // 1. Snapshot data (after ROUND_ENDS_AT) - most accurate
  // 2. Cached leaderboard data (before ROUND_ENDS_AT) - fastest
  // 3. Database API call (fallback) - most reliable

  useEffect(() => {
    if (!talentUuid) {
      return;
    }

    // If we have cached data and shouldn't use snapshot, use it
    if (isInTop200 && !shouldUseSnapshot) {
      return;
    }

    // Otherwise, fetch from database
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
        setSeparateRewardsDecision(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRewardsDecision();
  }, [talentUuid, isInTop200, shouldUseSnapshot]);

  // Determine the best data source
  let rewardsDecision: RewardsDecision;

  if (shouldUseSnapshot) {
    // TODO: After ROUND_ENDS_AT: Use snapshot data (most accurate)
    // This will be implemented when LeaderboardSnapshotService is ready
    rewardsDecision = separateRewardsDecision || null;
  } else if (isInTop200 && userTop200Entry) {
    // Before ROUND_ENDS_AT: Use cached leaderboard data (fastest)
    // Note: This only knows about opted-out users, not opted-in users
    // So we need to handle the "unknown" case properly
    const top200OptOutStatus = userTop200Entry.isOptedOut;
    if (top200OptOutStatus === true) {
      rewardsDecision = "opted_out";
    } else {
      // User hasn't opted out, but we don't know if they've opted in
      // Fall back to database data
      rewardsDecision = separateRewardsDecision || null;
    }
  } else {
    // Non-top-200 users: Use database data
    rewardsDecision = separateRewardsDecision || null;
  }

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
    loading: loading && !(isInTop200 && !shouldUseSnapshot), // Don't show loading for cached data
    error,
  };
}

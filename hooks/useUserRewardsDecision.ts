"use client";

import { useState, useEffect, useCallback } from "react";
import type { RewardsDecision } from "@/lib/types/user-preferences";

export interface UseUserRewardsDecisionReturn {
  data: {
    rewardsDecision: RewardsDecision;
  };
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to check rewards decision status for any user
 *
 * @param talentUuid - User's Talent Protocol UUID
 * @returns Rewards decision status, loading state, error state, and refetch function
 */
export function useUserRewardsDecision(
  talentUuid: string | null,
): UseUserRewardsDecisionReturn {
  const [rewardsDecision, setRewardsDecision] =
    useState<RewardsDecision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchRewardsDecision = useCallback(async () => {
    if (!talentUuid) {
      return;
    }

    console.log("useUserRewardsDecision - fetching for talentUuid:", talentUuid);
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

      console.log("useUserRewardsDecision - received data:", data.data?.rewards_decision);
      setRewardsDecision(data.data?.rewards_decision || null);
    } catch (err) {
      console.error("Error fetching rewards decision status:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setRewardsDecision(null);
    } finally {
      setLoading(false);
    }
  }, [talentUuid]);

  useEffect(() => {
    fetchRewardsDecision();
  }, [fetchRewardsDecision, refreshTrigger]);

  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    data: {
      rewardsDecision,
    },
    loading,
    error,
    refetch,
  };
}

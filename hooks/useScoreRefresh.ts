import { useState, useRef } from "react";
import { triggerScoreCalculation } from "@/app/services/scoreRefreshService";
import { clearUserCredentialsCache } from "@/lib/cache-keys";
import posthog from "posthog-js";

interface UseScoreRefreshResult {
  isRefreshing: boolean;
  successMessage: string | null;
  error: string | null;
  refreshScore: () => Promise<void>;
  clearError: () => void;
}

interface AnalyticsData {
  creatorScore?: number;
  totalEarnings?: number;
  totalFollowers?: number;
  isOwnProfile?: boolean;
  hasScore?: boolean;
  isInCooldown?: boolean;
  isCalculating?: boolean;
}

export function useScoreRefresh(
  talentUUID: string,
  onSuccess?: () => void,
  analyticsData?: AnalyticsData,
): UseScoreRefreshResult {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasCalledSuccessRef = useRef(false);

  const clearError = () => {
    setError(null);
  };

  const refreshScore = async () => {
    if (!talentUUID || isRefreshing) return;

    // Track analytics at the beginning of refresh
    if (analyticsData) {
      posthog.capture("profile_refresh_score_clicked", {
        creator_score: analyticsData.creatorScore,
        total_earnings: analyticsData.totalEarnings,
        total_followers: analyticsData.totalFollowers,
        is_own_profile: analyticsData.isOwnProfile,
        has_score: analyticsData.hasScore,
        is_in_cooldown: analyticsData.isInCooldown,
        is_calculating: analyticsData.isCalculating,
      });
    }

    try {
      setIsRefreshing(true);
      // Clear any existing messages
      setError(null);
      setSuccessMessage(null);
      hasCalledSuccessRef.current = false;

      // Clear user's credential cache before triggering refresh
      clearUserCredentialsCache(talentUUID);

      // Also clear badge caches (same as badges page)
      try {
        await fetch("/api/badges/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            talentUUID: talentUUID,
            badgeSlug: "all",
            cacheKeys: ["USER_BADGES", "USER_CREATOR_SCORE"],
          }),
        });
      } catch (error) {
        console.error("Failed to clear badge caches:", error);
        // Don't fail the entire operation if badge cache clearing fails
      }

      const result = await triggerScoreCalculation(talentUUID);

      if (result.success) {
        setSuccessMessage("Calculation enqueued");
        // Call onSuccess callback to trigger score refetch
        // Only call once per refresh to prevent loops
        if (onSuccess && !hasCalledSuccessRef.current) {
          hasCalledSuccessRef.current = true;
          // Small delay to show success message before refetching
          setTimeout(async () => {
            try {
              await onSuccess();
              // Reset refreshing state after successful refetch
              setIsRefreshing(false);
            } catch (error) {
              console.error("Error during score refetch:", error);
              setIsRefreshing(false);
            }
          }, 1000);
        } else {
          // If no onSuccess callback, reset refreshing state immediately
          setIsRefreshing(false);
        }
      } else {
        const errorMessage = result.error || "Failed to trigger calculation";
        setError(errorMessage);
        setIsRefreshing(false);
        // No auto-clear of error message
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to trigger calculation";
      setError(errorMessage);
      setIsRefreshing(false);
      // No auto-clear of error message
    }
  };

  return {
    isRefreshing,
    successMessage,
    error,
    refreshScore,
    clearError,
  };
}

import { useCallback, useState, useEffect } from "react";
import { useScoreRefresh } from "./useScoreRefresh";
import { useUserResolution } from "./useUserResolution";
import type { ProfileData } from "@/contexts/ProfileContext";

interface UseProfileActionsProps {
  talentUUID: string;
  refetchScore?: () => void;
  profile?: ProfileData["profile"];
  creatorScore?: number;
  lastCalculatedAt?: string | null;
  calculating?: boolean;
  totalFollowers?: number;
  totalEarnings?: number;
}

export function useProfileActions({
  talentUUID,
  refetchScore,
  profile,
  creatorScore,
  lastCalculatedAt,
  calculating,
  totalFollowers,
  totalEarnings,
}: UseProfileActionsProps) {
  const { talentUuid: currentUserTalentUuid } = useUserResolution();
  const [cooldownMinutes, setCooldownMinutes] = useState<number | null>(null);

  // Cooldown detection and countdown logic
  useEffect(() => {
    const calculateCooldownTime = () => {
      if (!lastCalculatedAt) {
        setCooldownMinutes(null);
        return;
      }

      const lastRefreshTime = new Date(lastCalculatedAt).getTime();
      const currentTime = new Date().getTime();
      const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
      const cooldownEndTime = lastRefreshTime + oneHourInMs;

      if (currentTime < cooldownEndTime) {
        const remainingMs = cooldownEndTime - currentTime;
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
        setCooldownMinutes(remainingMinutes);
      } else {
        setCooldownMinutes(null);
      }
    };

    // Calculate immediately
    calculateCooldownTime();

    // Update every minute
    const interval = setInterval(calculateCooldownTime, 60000);

    return () => clearInterval(interval);
  }, [lastCalculatedAt]);

  // Category data no longer needed in useProfileActions
  // (It was only used for share stats, which can work without it)

  // Score refresh hook
  const {
    isRefreshing,
    successMessage,
    error: refreshError,
    refreshScore,
    clearError,
  } = useScoreRefresh(talentUUID, refetchScore);

  // Don't auto-reset error state - let user see the error until page refresh

  // Check if this is the current user's profile
  const isOwnProfile =
    currentUserTalentUuid && currentUserTalentUuid === talentUUID;

  // Determine button text and state
  const isCalculatingOrRefreshing = calculating || isRefreshing;
  const hasNeverCalculated = lastCalculatedAt === null;
  const isInCooldown = cooldownMinutes !== null && cooldownMinutes > 0;

  const buttonText = hasNeverCalculated
    ? "Calculate Score"
    : isInCooldown
      ? `Refresh in ${cooldownMinutes}min`
      : "Refresh Score";
  const pendingText = "Refresh Pending";
  const failedText = "Refresh Failed";

  // Handle refresh/calculate score action
  const handleRefreshScore = useCallback(() => {
    // Prevent refresh if in cooldown, calculating, refreshing, or has error
    if (isCalculatingOrRefreshing || isInCooldown) {
      return;
    }
    refreshScore();
  }, [refreshScore, isCalculatingOrRefreshing, isInCooldown]);

  return {
    isOwnProfile,
    isCalculatingOrRefreshing,
    isInCooldown,
    buttonText,
    pendingText,
    failedText,
    refreshError,
    successMessage,
    handleRefreshScore,
  };
}

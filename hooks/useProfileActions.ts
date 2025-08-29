import { useCallback, useState, useEffect } from "react";
import { useScoreRefresh } from "./useScoreRefresh";
import { useFidToTalentUuid } from "./useUserResolution";
import type { ProfileData } from "@/contexts/ProfileContext";
import {
  composeCast,
  formatCompactNumber,
  formatNumberWithSuffix,
} from "@/lib/utils";

interface UseProfileActionsProps {
  talentUUID: string;
  refetchScore?: () => void;
  profile: ProfileData | null;
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
  const { talentUuid: currentUserTalentUuid } = useFidToTalentUuid();
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

  // Check if this is the current user's profile
  const isOwnProfile = Boolean(
    currentUserTalentUuid && currentUserTalentUuid === talentUUID,
  );

  // Calculate hasNoScore for analytics
  const hasNoScore = !creatorScore || creatorScore === 0;

  // Determine button text and state
  const hasNeverCalculated = lastCalculatedAt === null;
  const isInCooldown = cooldownMinutes !== null && cooldownMinutes > 0;

  // Score refresh hook with analytics
  const {
    isRefreshing,
    successMessage,
    error: refreshError,
    refreshScore,
    clearError,
  } = useScoreRefresh(talentUUID, refetchScore, {
    creatorScore,
    totalEarnings,
    totalFollowers,
    isOwnProfile,
    hasScore: !hasNoScore,
    isInCooldown,
    isCalculating: calculating,
  });

  // Don't auto-reset error state - let user see the error until page refresh

  const isCalculatingOrRefreshing = calculating || isRefreshing;

  const buttonText = hasNeverCalculated
    ? "Calculate Score"
    : isInCooldown
      ? `Refresh in ${cooldownMinutes}min`
      : "Refresh Score";
  const pendingText = "Refresh Pending";
  const failedText = "Refresh Failed";

  // Handle share stats action
  const handleShareStats = useCallback(async () => {
    // Get creator category from data, fallback to bio, then "Creator"
    const creatorType = profile?.bio || "Creator"; // Simplified - no category data needed
    const scoreText = creatorScore ? creatorScore.toLocaleString() : "—";
    const followersText = formatCompactNumber(totalFollowers || 0);
    const earningsText = totalEarnings
      ? formatNumberWithSuffix(totalEarnings)
      : "—";

    // Get Farcaster handle for the share text
    const farcasterHandle = profile?.fname || "creator";

    // Use profile URL instead of static image for better engagement
    const profileUrl = `${window.location.origin}/${talentUUID}`;

    // Create platform-specific share text
    const farcasterText = `Check @${farcasterHandle}'s reputation as an onchain creator:\n\n📊 Creator Score: ${scoreText}\n🫂 Total Followers: ${followersText}\n💰 Total Earnings: ${earningsText}\n\nSee the full profile in the Creator Score app, built by @talent 👇`;

    const twitterText = `Check ${profile?.display_name || profile?.name || "Creator"}'s onchain creator stats:\n\n📊 Creator Score: ${scoreText}\n🫂 Total Followers: ${followersText}\n💰 Total Earnings: ${earningsText}\n\nTrack your reputation in the Creator Score App, built by @TalentProtocol 👇`;

    // Use the new cross-platform composeCast function
    await composeCast(farcasterText, twitterText, [profileUrl]);
  }, [profile, creatorScore, totalFollowers, totalEarnings, talentUUID]);

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

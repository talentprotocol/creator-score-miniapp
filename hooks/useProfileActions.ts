import { useState, useEffect, useCallback } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useUserResolution } from "@/hooks/useUserResolution";
import { useScoreRefresh } from "@/hooks/useScoreRefresh";
// Removed useCreatorCategory - data now comes from ProfileContext
import { formatNumberWithSuffix, formatK, composeCast } from "@/lib/utils";
import type { ProfileData } from "@/contexts/ProfileContext";

interface UseProfileActionsProps {
  talentUUID: string;
  refetchScore?: () => void;
  profile?: ProfileData | null;
  creatorScore?: number;
  lastCalculatedAt?: string | null;
  calculating?: boolean;
  totalFollowers?: number;
  totalEarnings?: number | null;
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
  const { context } = useMiniKit();
  const user = getUserContext(context);
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

  // Handle share stats action
  const handleShareStats = useCallback(async () => {
    // Get creator category from data, fallback to bio, then "Creator"
    const creatorType = profile?.bio || "Creator"; // Simplified - no category data needed
    const scoreText = creatorScore ? creatorScore.toLocaleString() : "—";
    const followersText = formatK(totalFollowers || 0);
    const earningsText = totalEarnings
      ? formatNumberWithSuffix(totalEarnings)
      : "—";

    // Get Farcaster handle for the share text
    const farcasterHandle = profile?.fname || "creator";
    const displayName = profile?.display_name || profile?.name || "Creator";

    // Create separate copy for Farcaster and Twitter
    const farcasterShareText = `Check @${farcasterHandle}'s reputation as an onchain creator:\n\n📊 Creator Score: ${scoreText}\n🫂 Total Followers: ${followersText}\n💰 Total Earnings: ${earningsText}\n\nSee the full profile in the Creator Score mini app, built by @talent 👇`;

    const twitterShareText = `Check ${displayName}'s onchain creator stats:\n\n📊 Creator Score: ${scoreText}\n🫂 Total Followers: ${followersText}\n💰 Total Earnings: ${earningsText}\n\n\nTrack your reputation in the Creator Score App, built by @TalentProtocol 👇`;

    // Use canonical public URL format for sharing
    // Always use https://creatorscore.app/[farcaster%20handle] format
    const profileUrl = `https://creatorscore.app/${encodeURIComponent(farcasterHandle)}`;

    // Use the new cross-platform composeCast function
    // The composeCast function will choose the appropriate text based on the platform
    await composeCast(
      farcasterShareText,
      twitterShareText,
      [profileUrl],
      context,
    );
  }, [
    profile,
    creatorScore,
    totalFollowers,
    totalEarnings,
    talentUUID,
    context,
  ]);

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
    handleShareStats,
    handleRefreshScore,
  };
}

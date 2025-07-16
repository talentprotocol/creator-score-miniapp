import { useState, useEffect, useCallback } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { resolveFidToTalentUuid } from "@/lib/user-resolver";
import { useScoreRefresh } from "@/hooks/useScoreRefresh";
import { useCreatorCategory } from "@/hooks/useCreatorCategory";
import { formatNumberWithSuffix, formatK } from "@/lib/utils";

interface UseProfileActionsProps {
  talentUUID: string;
  refetchScore?: () => void;
  profile?: {
    bio?: string;
  };
  creatorScore?: number;
  lastCalculatedAt?: string | null;
  calculating?: boolean;
  totalFollowers?: number;
  totalEarnings?: number | null | undefined;
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
  const [currentUserTalentUuid, setCurrentUserTalentUuid] = useState<
    string | null
  >(null);

  // Resolve current user's Talent UUID
  useEffect(() => {
    async function resolveCurrentUserTalentUuid() {
      if (user?.fid) {
        try {
          const uuid = await resolveFidToTalentUuid(user.fid);
          setCurrentUserTalentUuid(uuid);
        } catch (error) {
          setCurrentUserTalentUuid(null);
        }
      }
    }

    resolveCurrentUserTalentUuid();
  }, [user?.fid]);

  // Get creator category data
  const { data: categoryData } = useCreatorCategory(talentUUID);

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
  const buttonText = hasNeverCalculated ? "Calculate Score" : "Refresh Score";
  const pendingText = "Refresh Pending";
  const failedText = "Refresh Failed";

  // Handle share stats action
  const handleShareStats = useCallback(() => {
    // Get creator category from data, fallback to bio, then "Creator"
    const creatorType = categoryData?.primaryCategory
      ? `${categoryData.primaryCategory.name} ${categoryData.primaryCategory.emoji}`
      : profile?.bio || "Creator";
    const scoreText = creatorScore ? creatorScore.toLocaleString() : "—";
    const followersText = formatK(totalFollowers || 0);
    const earningsText = totalEarnings
      ? formatNumberWithSuffix(totalEarnings)
      : "—";

    const shareText = `🎯 ${creatorType}\n📊 Creator Score: ${scoreText}\n👥 Total Followers: ${followersText}\n💰 Total Earnings: ${earningsText}\n\nCheck out my full profile on Talent Protocol!`;

    // Proper Farcaster environment detection (like in lib/utils.ts)
    const isInFarcaster =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("farcaster") ||
        window.location.hostname.includes("warpcast") ||
        // Check for Farcaster-specific globals
        "farcasterFrame" in window ||
        // Check user agent for Farcaster
        navigator.userAgent.includes("Farcaster"));

    if (isInFarcaster && window?.parent?.postMessage) {
      window.parent.postMessage(
        {
          type: "createCast",
          data: {
            cast: {
              text: shareText,
            },
          },
        },
        "*",
      );
    } else {
      // Use Warpcast intent URL when not in Farcaster
      const encodedText = encodeURIComponent(shareText);
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodedText}`;
      window.open(warpcastUrl, "_blank");
    }
  }, [categoryData, profile, creatorScore, totalFollowers, totalEarnings]);

  // Handle refresh/calculate score action
  const handleRefreshScore = useCallback(() => {
    // Prevent multiple refresh calls
    if (isCalculatingOrRefreshing) {
      return;
    }
    refreshScore();
  }, [refreshScore, isCalculatingOrRefreshing]);

  return {
    isOwnProfile,
    isCalculatingOrRefreshing,
    buttonText,
    pendingText,
    failedText,
    refreshError,
    successMessage,
    handleShareStats,
    handleRefreshScore,
  };
}

import { useState, useEffect, useCallback, useRef } from "react";
import { useProfileContext } from "@/contexts/ProfileContext";
import posthog from "posthog-js";
import type { BadgeState } from "@/app/services/badgesService";

interface UseBadgeVerifyResult {
  isVerifying: boolean;
  cooldownMinutes: number | null;
  error: string | null;
  progressMessage: string | null;
  verifyBadge: () => Promise<void>;
  clearError: () => void;
}

interface VerifyAnalyticsData {
  badgeSlug: string;
  badgeTitle: string;
  currentLevel: number;
  progressPct: number;
  isLocked: boolean;
  isMaxLevel: boolean;
}

/**
 * BADGE VERIFICATION HOOK
 *
 * Handles badge verification with score refresh, cooldown management,
 * and progress feedback. Follows coding principles by calling API routes
 * and maintaining client-server separation.
 *
 * Features:
 * - Hybrid cooldown detection (ProfileContext + fresh fetch)
 * - Badge-specific cache invalidation
 * - Progress-aware motivational messaging
 * - PostHog analytics integration
 * - Error handling and state management
 */
export function useBadgeVerify(
  talentUUID: string,
  badge: BadgeState,
  onBadgeRefetch?: () => Promise<void>,
): UseBadgeVerifyResult {
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldownMinutes, setCooldownMinutes] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  const hasCalledSuccessRef = useRef(false);
  const profileContext = useProfileContext();

  /**
   * Calculate cooldown from lastCalculatedAt timestamp
   * Uses same logic as useProfileActions (1-hour cooldown)
   */
  const calculateCooldown = useCallback(
    (lastCalculatedAt: string | null): number | null => {
      if (!lastCalculatedAt) return null;

      const lastRefreshTime = new Date(lastCalculatedAt).getTime();
      const currentTime = new Date().getTime();
      const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
      const cooldownEndTime = lastRefreshTime + oneHourInMs;

      if (currentTime < cooldownEndTime) {
        const remainingMs = cooldownEndTime - currentTime;
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
        return remainingMinutes;
      }

      return null;
    },
    [],
  );

  /**
   * Hybrid cooldown detection: use ProfileContext when available,
   * otherwise fetch fresh profile data
   */
  useEffect(() => {
    const detectCooldown = async () => {
      // Try to get cooldown from existing ProfileContext first
      if (profileContext?.profileData?.lastCalculatedAt) {
        const cooldown = calculateCooldown(
          profileContext.profileData.lastCalculatedAt,
        );
        setCooldownMinutes(cooldown);
        return;
      }

      // Fallback: fetch fresh profile data for cooldown
      try {
        const response = await fetch(
          `/api/user-profile?talentUuid=${talentUUID}`,
        );
        if (response.ok) {
          const profileData = await response.json();
          const cooldown = calculateCooldown(profileData.lastCalculatedAt);
          setCooldownMinutes(cooldown);
        }
      } catch (err) {
        console.warn("Failed to fetch profile data for cooldown:", err);
        setCooldownMinutes(null);
      }
    };

    if (talentUUID) {
      detectCooldown();

      // Update cooldown every minute
      const interval = setInterval(detectCooldown, 60000);
      return () => clearInterval(interval);
    }
  }, [
    talentUUID,
    profileContext?.profileData?.lastCalculatedAt,
    calculateCooldown,
  ]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get badge-specific cache keys for invalidation
   */
  const getBadgeCacheKeys = useCallback((badgeSlug: string): string[] => {
    const baseCaches = ["USER_BADGES"];

    switch (badgeSlug) {
      case "creator-score":
        return [...baseCaches, "USER_CREATOR_SCORE", "CREATOR_SCORES"];
      case "total-earnings":
        return [...baseCaches, "CREDENTIALS", "TOTAL_EARNINGS"];
      case "total-followers":
        return [...baseCaches, "PROFILE_SOCIAL_ACCOUNTS", "SOCIAL_ACCOUNTS"];
      case "total-collectors":
        return [...baseCaches, "CREDENTIALS"];
      case "talent":
        return [...baseCaches, "USER_TOKEN_BALANCE"];
      case "base":
        return [...baseCaches, "DATA_POINTS_SUM"];
      default:
        return baseCaches; // Safe fallback
    }
  }, []);

  /**
   * Main verification function
   */
  const verifyBadge = useCallback(async () => {
    if (!talentUUID || isVerifying || cooldownMinutes !== null) return;

    // Track verification attempt
    const analyticsData: VerifyAnalyticsData = {
      badgeSlug: badge.badgeSlug,
      badgeTitle: badge.title,
      currentLevel: badge.currentLevel,
      progressPct: badge.progressPct,
      isLocked: badge.currentLevel === 0,
      isMaxLevel: badge.isMaxLevel,
    };

    posthog.capture("badge_verify_clicked", {
      badge_slug: analyticsData.badgeSlug,
      badge_title: analyticsData.badgeTitle,
      current_level: analyticsData.currentLevel,
      progress_pct: analyticsData.progressPct,
      is_locked: analyticsData.isLocked,
      is_max_level: analyticsData.isMaxLevel,
    });

    try {
      setIsVerifying(true);
      setError(null);
      setProgressMessage(null);
      hasCalledSuccessRef.current = false;

      // Store progress before verification
      const oldProgressPct = badge.progressPct;
      const oldLevel = badge.currentLevel;

      // Step 1: Trigger score calculation
      const response = await fetch("/api/talent-score-refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          talent_protocol_id: talentUUID,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      if (!result.score && !result.message) {
        throw new Error("Failed to trigger score calculation");
      }

      // Step 2: Clear badge-specific caches
      const cacheKeys = getBadgeCacheKeys(badge.badgeSlug);
      await fetch("/api/badges/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          talentUUID,
          badgeSlug: badge.badgeSlug,
          cacheKeys,
        }),
      });

      // Step 3: Trigger badge data refetch
      if (onBadgeRefetch && !hasCalledSuccessRef.current) {
        hasCalledSuccessRef.current = true;

        // Small delay before refetching to allow cache clearing
        setTimeout(async () => {
          try {
            await onBadgeRefetch();

            // After refetch, compare progress and show feedback
            // Note: We'll need updated badge state from parent to compare
            // For now, show generic success message
            setProgressMessage("Verification completed! Badge data updated.");

            // Track verification completion
            posthog.capture("badge_verify_completed", {
              badge_slug: analyticsData.badgeSlug,
              success: true,
              old_level: oldLevel,
              old_progress_pct: oldProgressPct,
            });

            // Clear progress message after delay
            setTimeout(() => {
              setProgressMessage(null);
            }, 3000);
          } catch (refetchError) {
            console.error("Error during badge refetch:", refetchError);
          } finally {
            setIsVerifying(false);
          }
        }, 1000);
      } else {
        setIsVerifying(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to verify badge";
      setError(errorMessage);
      setIsVerifying(false);

      // Track verification failure
      posthog.capture("badge_verify_failed", {
        badge_slug: analyticsData.badgeSlug,
        error: errorMessage,
      });
    }
  }, [
    talentUUID,
    isVerifying,
    cooldownMinutes,
    badge,
    getBadgeCacheKeys,
    onBadgeRefetch,
  ]);

  return {
    isVerifying,
    cooldownMinutes,
    error,
    progressMessage,
    verifyBadge,
    clearError,
  };
}

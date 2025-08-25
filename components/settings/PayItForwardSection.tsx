import React, { useState, useEffect, useCallback } from "react";
import { ButtonFullWidth } from "@/components/ui/button-full-width";
import { Typography } from "@/components/ui/typography";
import { HandHeart, Share2 } from "lucide-react";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { useLeaderboardData } from "@/hooks/useLeaderboardOptimized";
import { useOptOutStatus } from "@/hooks/useOptOutStatus";
import { RewardsCalculationService } from "@/app/services/rewardsCalculationService";
import { CheckCircle, AlertCircle } from "lucide-react";
import { ConfettiButton } from "@/components/ui/confetti";
import { ShareModal } from "@/components/modals/ShareModal";
import { ShareContentGenerators } from "@/lib/sharing";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { usePostHog } from "posthog-js/react";
import { detectClient } from "@/lib/utils";

/**
 * PayItForwardSection Component
 *
 * Provides the user interface for creators to opt out of receiving rewards.
 * The opted-out rewards are redistributed proportionally to other eligible creators.
 *
 * Features:
 * - Shows current reward amount (crossed out if already opted out)
 * - Requires explicit confirmation to prevent accidental opt-outs
 * - Provides visual feedback with success/error states
 * - Updates leaderboard data immediately after successful opt-out
 * - Integrates with PostHog analytics for user behavior tracking
 * - Confetti celebration upon successful opt-out
 * - Social sharing capabilities for Farcaster and Twitter
 */
export function PayItForwardSection() {
  // State management for opt-out flow
  const [isOptingOut, setIsOptingOut] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // User context and data hooks
  const { talentUuid } = useFidToTalentUuid();
  const {
    entries: top200Entries,
    refetch,
    updateUserOptOutStatus,
  } = useLeaderboardData();

  // Note: We use talentUuid directly as handle for URL-safe sharing
  const { context } = useMiniKit();
  const posthog = usePostHog();
  const [client, setClient] = useState<string | null>(null);

  // Find current user's leaderboard entry
  const userTop200Entry = top200Entries.find(
    (entry) => entry.talent_protocol_id === talentUuid,
  );

  // Use combined opt-out status check for both top-200 and non-top-200 users
  const { isOptedOut: isAlreadyOptedOut } = useOptOutStatus(
    talentUuid,
    userTop200Entry,
  );
  const hasPaidForward = success || isAlreadyOptedOut;

  // Show share button for already opted out users (from previous sessions) or after confetti completes
  const shouldShowShare = (isAlreadyOptedOut && !success) || showShare;

  // Calculate current rewards for display
  const currentRewards = userTop200Entry
    ? RewardsCalculationService.calculateUserReward(
        userTop200Entry.score,
        userTop200Entry.rank,
        userTop200Entry.isBoosted || false,
        false, // not opted out yet for display
        top200Entries,
      )
    : "$0";

  // If already opted out (from previous session), ensure the opt-out callout is hidden
  // This is now handled server-side during opt-out. No client effect needed.

  // Start confetti when success is freshly achieved (not for already opted out users)
  useEffect(() => {
    if (success) {
      // Only show confetti for fresh opt-outs, not for users who were already opted out
      setConfettiActive(true);
    }
  }, [success]);

  // Handle confetti completion - show share button after confetti finishes
  const handleConfettiComplete = useCallback(() => {
    setConfettiActive(false);
    setShowShare(true);
  }, []);

  // Detect client type for sharing
  useEffect(() => {
    detectClient(context).then((client) => {
      setClient(client);
    });
  }, [context]);

  /**
   * Handles the opt-out submission process
   * - Validates user confirmation
   * - Submits opt-out request to API
   * - Updates local state and cache
   * - Triggers confetti celebration
   */
  const handleOptOut = async () => {
    if (!hasConfirmed || !talentUuid) return;

    setIsOptingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/user-preferences/optout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talent_uuid: talentUuid,
          confirm_optout: true,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        try {
          console.log(
            "[OptOut] Success. Instant UI update + scheduled force-fresh refetch",
          );
          // Only update cache if user is in top 200 (has leaderboard entry)
          if (userTop200Entry) {
            updateUserOptOutStatus(talentUuid, true);
          }
          // Schedule a force-fresh refetch to clear local cache and repopulate from server
          setTimeout(() => {
            refetch(true);
          }, 100);
        } catch {}
      } else {
        const errorMessage = result.error || "Failed to pay it forward";
        setError(errorMessage);
        console.error("Opt-out failed:", errorMessage);
      }
    } catch (error) {
      const errorMessage = "Operation error. Please try again.";
      setError(errorMessage);
      console.error("Error opting out:", error);
    } finally {
      setIsOptingOut(false);
    }
  };

  // Reset states when checkbox changes
  const handleCheckboxChange = (checked: boolean) => {
    if (success) return; // Don't allow changes after successful opt-out
    setHasConfirmed(checked);
    setError(null);
  };

  /**
   * Handles opening the share stats modal
   * - Tracks analytics event
   * - Opens modal for platform selection
   */
  const handleShareStats = async () => {
    // Track pay it forward share click (preserve existing analytics)
    posthog?.capture("pay_it_forward_share_clicked", {
      talent_uuid: talentUuid,
      current_rewards: currentRewards,
    });

    // Always show modal for sharing
    setIsShareModalOpen(true);
  };

  // Prepare sharing data for the new sharing system
  const shareContext = React.useMemo(
    () => ({
      talentUUID: talentUuid || "",
      handle: talentUuid || "creator", // Use talentUuid directly as handle for URL-safe sharing
      appClient: client,
    }),
    [talentUuid, client], // Remove displayName dependency
  );

  const shareContent = React.useMemo(
    () => ShareContentGenerators.optout(shareContext),
    [shareContext],
  );

  const shareAnalytics = React.useMemo(
    () => ({
      eventPrefix: "pay_it_forward_share",
      metadata: {
        share_type: "optout" as const,
        talent_uuid: talentUuid,
        current_rewards: currentRewards,
      },
    }),
    [talentUuid, currentRewards],
  );

  return (
    <div className="relative space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="space-y-4">
          {/* Description: Explains what the feature does and its benefits */}
          <Typography size="base" className="text-foreground">
            Donate your rewards to the remaining top creators, keep your
            leaderboard position and earn a special onchain badge.
          </Typography>

          {/* Current Rewards Display: Shows user's potential rewards amount */}
          <div className="flex items-center gap-1.5">
            <Typography size="base">Expected Reward Amount:</Typography>
            <Typography
              size="xl"
              weight="medium"
              className={`${hasPaidForward ? "text-brand-green line-through" : "text-foreground"}`}
            >
              {currentRewards}
            </Typography>
          </div>

          {/* Confirmation Checkbox: User must acknowledge understanding before proceeding */}
          {!hasPaidForward ? (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="confirm-optout"
                checked={hasConfirmed}
                onChange={(e) => handleCheckboxChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor="confirm-optout"
                className="text-xs text-muted-foreground"
              >
                I understand that donating is irreversible.
              </label>
            </div>
          ) : null}

          {/* Action Button: Main CTA that processes the opt-out request or shares */}
          {shouldShowShare ? (
            <ButtonFullWidth
              icon={<Share2 className="h-4 w-4" />}
              variant="brand-green"
              onClick={handleShareStats}
              align="center"
            >
              Share Your Good Deed
            </ButtonFullWidth>
          ) : hasPaidForward ? (
            <ConfettiButton
              variant="default"
              className="w-full h-auto rounded-xl px-6 py-4 bg-brand-green text-white"
              disabled={confettiActive}
              autoFire={confettiActive}
              onConfettiComplete={handleConfettiComplete}
            >
              <div className="flex w-full items-center justify-center gap-3">
                <CheckCircle className="h-4 w-4" />
                <span>Successfully Paid Forward!</span>
              </div>
            </ConfettiButton>
          ) : (
            <ButtonFullWidth
              icon={
                error ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <HandHeart className="h-4 w-4" />
                )
              }
              variant={error ? "destructive" : "brand-green"}
              onClick={handleOptOut}
              disabled={!hasConfirmed || isOptingOut}
              align="center"
            >
              {isOptingOut
                ? "Processing..."
                : error
                  ? "Failed: Please Try Again"
                  : "Confirm and Pay It Forward"}
            </ButtonFullWidth>
          )}

          {/* TEMP: Test Confetti */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4">
              <ConfettiButton
                variant="ghost"
                className="w-full border border-dashed border-gray-300"
              >
                🎉 Test Confetti (Dev Only)
              </ConfettiButton>
            </div>
          )}
        </div>
      </div>

      {/* Share Good Deed Modal */}
      <ShareModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        content={shareContent}
        context={shareContext}
        analytics={shareAnalytics}
        options={{
          disableTwitter: client !== "browser",
        }}
      />
    </div>
  );
}

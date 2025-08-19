import React, { useState, useRef, useEffect, useCallback } from "react";
import { ButtonFullWidth } from "@/components/ui/button-full-width";
import { Typography } from "@/components/ui/typography";
import { HandHeart, Share2 } from "lucide-react";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { useLeaderboardData } from "@/hooks/useLeaderboardOptimized";
import { RewardsCalculationService } from "@/app/services/rewardsCalculationService";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { ShareStatsModal } from "@/components/modals/ShareStatsModal";
import { useResolvedTalentProfile } from "@/hooks/useResolvedTalentProfile";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { usePostHog } from "posthog-js/react";
import { detectClient, openExternalUrl } from "@/lib/utils";

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
 */
export function PayItForwardSection() {
  const [isOptingOut, setIsOptingOut] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const confettiRef = useRef<ConfettiRef>(null);
  const { talentUuid } = useFidToTalentUuid();
  const {
    entries: top200Entries,
    refetch,
    updateUserOptOutStatus,
  } = useLeaderboardData();

  // Get profile data for sharing
  const { displayName } = useResolvedTalentProfile();
  const { context } = useMiniKit();
  const posthog = usePostHog();
  const [client, setClient] = useState<string | null>(null);

  const userTop200Entry = top200Entries.find(
    (entry) => entry.talent_protocol_id === talentUuid,
  );

  const isAlreadyOptedOut = Boolean(userTop200Entry?.isOptedOut);
  const hasPaidForward = success || isAlreadyOptedOut;

  // Show share button for already opted out users or after success + delay
  const shouldShowShare = isAlreadyOptedOut || showShare;

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

  // Trigger confetti celebration and transition to share after success
  useEffect(() => {
    if (success && confettiRef.current) {
      confettiRef.current.fireSideCannons();
      // Show share button after brief success message (2 seconds)
      const timer = setTimeout(() => {
        setShowShare(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Detect client type for sharing
  useEffect(() => {
    detectClient(context).then((client) => {
      setClient(client);
    });
  }, [context]);

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
          // Instant UI update of in-memory + local cache
          updateUserOptOutStatus(talentUuid, true);
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

  // Handle share stats opening
  const handleShareStats = async () => {
    // Track pay it forward share click
    posthog?.capture("pay_it_forward_share_clicked", {
      talent_uuid: talentUuid,
      current_rewards: currentRewards,
    });

    // Always show modal for sharing
    setIsShareModalOpen(true);
  };

  // Handle Farcaster sharing from modal
  const handleShareFarcaster = useCallback(async () => {
    const profileUrl = `https://creatorscore.app/${talentUuid}`;
    const farcasterText = `I paid forward 100% of my Creator Score rewards to support onchain creators.\n\nCheck out my profile in the Creator Score mini app, built by @talent 👇`;

    // Track Farcaster share
    posthog?.capture("pay_it_forward_share_farcaster_clicked", {
      talent_uuid: talentUuid,
      current_rewards: currentRewards,
    });

    if (client === "farcaster" || client === "base") {
      try {
        const { sdk } = await import("@farcaster/frame-sdk");
        await sdk.actions.composeCast({
          text: farcasterText,
          embeds: [profileUrl],
        });
      } catch (error) {
        console.error("Failed to compose cast:", error);
      }
    } else {
      // Open Farcaster web app with pre-filled cast for browser
      const farcasterUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(farcasterText)}&embeds[]=${encodeURIComponent(profileUrl)}`;
      if (client === "browser") {
        window.open(farcasterUrl, "_blank");
      } else {
        openExternalUrl(farcasterUrl, null, client);
      }
    }
  }, [talentUuid, currentRewards, posthog, client]);

  // Handle Twitter sharing from modal
  const handleShareTwitter = useCallback(() => {
    const profileUrl = `https://creatorscore.app/${talentUuid}`;
    const twitterText = `I paid forward 100% of my Creator Score rewards to support onchain creators.\n\nCheck out my profile in the Creator Score App, built by @TalentProtocol 👇`;

    // Track Twitter share
    posthog?.capture("pay_it_forward_share_twitter_clicked", {
      talent_uuid: talentUuid,
      current_rewards: currentRewards,
    });

    // Always use web URL for Twitter sharing
    const twitterUrl = `https://x.com/intent/post?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(profileUrl)}`;
    if (client === "browser") {
      window.open(twitterUrl, "_blank");
    } else {
      openExternalUrl(twitterUrl, null, client);
    }
  }, [talentUuid, currentRewards, posthog, client]);

  return (
    <div className="relative space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="space-y-4">
          {/* Description: Explains what the feature does and its benefits */}
          <Typography size="base" weight="medium" className="text-foreground">
            Donate your rewards to the remaining creators, keep your leaderboard
            position and earn a special onchain badge.
          </Typography>

          {/* Current Rewards Display: Shows user's potential rewards amount */}
          <div className="flex items-center gap-1.5">
            <Typography size="base" weight="medium">
              Your Rewards:
            </Typography>
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
                className="text-sm text-muted-foreground"
              >
                I understand that opting out of rewards is irreversible.
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
          ) : (
            <ButtonFullWidth
              icon={
                hasPaidForward ? (
                  <CheckCircle className="h-4 w-4" />
                ) : error ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <HandHeart className="h-4 w-4" />
                )
              }
              variant={
                hasPaidForward
                  ? "brand-green"
                  : error
                    ? "destructive"
                    : "brand-green"
              }
              onClick={handleOptOut}
              disabled={!hasConfirmed || isOptingOut || hasPaidForward}
              align="center"
            >
              {isOptingOut
                ? "Processing..."
                : hasPaidForward
                  ? "Successfully Paid Forward!"
                  : error
                    ? "Failed: Please Try Again"
                    : "Confirm and Pay It Forward"}
            </ButtonFullWidth>
          )}

          {/* TEMP: Test button for confetti animation */}
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={() => {
                console.log("Test button clicked!");
                console.log("confettiRef.current:", confettiRef.current);
                if (confettiRef.current) {
                  console.log("Calling fireSideCannons...");
                  confettiRef.current.fireSideCannons();
                } else {
                  console.log("confettiRef.current is null");
                }
              }}
              className="mt-4 w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              🎉 Test Confetti Animation (Dev Only)
            </button>
          )}
        </div>
      </div>

      {/* Confetti Canvas: Positioned to cover full screen for side cannons effect */}
      <Confetti
        ref={confettiRef}
        className="fixed inset-0 pointer-events-none z-40"
        manualstart={true}
      />

      {/* Share Stats Modal */}
      <ShareStatsModal
        open={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        talentUUID={talentUuid || ""}
        handle={displayName || talentUuid || "creator"}
        onShareFarcaster={handleShareFarcaster}
        onShareTwitter={handleShareTwitter}
        appClient={client}
        disableTwitter={client !== "browser"}
        title="Share Your Good Deed"
        description="Let the world know you support creators"
      />
    </div>
  );
}

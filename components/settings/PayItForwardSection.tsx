import React, { useState, useEffect } from "react";
import { ButtonFullWidth } from "@/components/ui/button-full-width";
import { Typography } from "@/components/ui/typography";
import { Share2 } from "lucide-react";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { useRewardsData } from "@/hooks/useRewardsData";

import { CheckCircle } from "lucide-react";
import { ShareModal } from "@/components/modals/ShareModal";
import { ShareContentGenerators } from "@/lib/sharing";

import { usePostHog } from "posthog-js/react";

/**
 * PayItForwardSection Component (Read-Only)
 *
 * Displays read-only information about a user's Pay It Forward decision.
 * Only shown if the user has opted out of receiving rewards.
 *
 * Features:
 * - Shows reward amount that was donated (crossed out)
 * - Displays confirmation badge
 * - Social sharing capabilities for Farcaster and Twitter
 * - No interaction - purely informational
 */
export function PayItForwardSection() {
  // State management for display and sharing only
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // User context and data hooks
  const { talentUuid, handle } = useFidToTalentUuid();
  const { entries: leaderboardEntries } = useRewardsData(); // Get leaderboard data with opt-out status

  const posthog = usePostHog();

  // Find user's entry in leaderboard data to get opt-out status and reward amount
  const userEntry = React.useMemo(() => {
    if (!talentUuid || !leaderboardEntries.length) return null;
    return leaderboardEntries.find(
      (entry) => String(entry.talent_protocol_id) === String(talentUuid),
    );
  }, [talentUuid, leaderboardEntries]);

  const isOptedOut = userEntry?.isOptedOut || false;
  const rewardAmount = userEntry?.baseReward || 0;

  // Simple fetch for fname from talent-user API (same as profile layout)
  const [fname, setFname] = useState<string | null>(null);
  useEffect(() => {
    if (!talentUuid) {
      setFname(null);
      return;
    }
    fetch(`/api/talent-user?id=${talentUuid}`)
      .then((response) => response.json())
      .then((data) => setFname(data?.fname || null))
      .catch(() => setFname(null));
  }, [talentUuid]);

  // Get the handle from fname first, then from the hook
  const userHandle = fname || handle || talentUuid || "creator";

  // Format the reward amount that was donated
  const currentRewards =
    rewardAmount >= 1
      ? `$${rewardAmount.toFixed(0)}`
      : `$${rewardAmount.toFixed(2)}`;

  // Prepare sharing data for the new sharing system (before early returns to avoid hooks rule violations)
  const shareContext = React.useMemo(
    () => ({
      talentUUID: talentUuid || "",
      handle: userHandle || talentUuid || "creator", // Use userHandle from profile first, fallback to talentUuid
      appClient: "browser", // Always browser context for PayItForwardSection
    }),
    [talentUuid, userHandle], // Remove handle dependency since we use userHandle
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

  // Early return if not opted out
  if (!isOptedOut) {
    return null; // Only show this section if user opted out
  }

  // Read-only component - no action handlers needed

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

  return (
    <div className="relative space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="space-y-4">
          {/* Description: Shows what was done */}
          <Typography size="base" className="text-foreground">
            You donated your rewards to other creators and earned a special
            onchain badge.
          </Typography>

          {/* Reward Amount Display: Shows donated amount (crossed out) */}
          <div className="flex items-center gap-1.5">
            <Typography size="base">Donated Amount:</Typography>
            <Typography
              size="xl"
              weight="medium"
              className="text-brand-green line-through"
            >
              {currentRewards}
            </Typography>
          </div>

          {/* Success Status Display */}
          <div className="flex w-full items-center justify-center gap-3 rounded-xl px-6 py-4 bg-brand-green text-white">
            <CheckCircle className="h-4 w-4" />
            <span>Successfully Paid Forward!</span>
          </div>

          {/* Share Button */}
          <ButtonFullWidth
            icon={<Share2 className="h-4 w-4" />}
            variant="brand-green"
            onClick={handleShareStats}
            align="center"
          >
            Share Your Good Deed
          </ButtonFullWidth>
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
          disableTwitter: false, // Always allow Twitter sharing in browser context
        }}
      />
    </div>
  );
}

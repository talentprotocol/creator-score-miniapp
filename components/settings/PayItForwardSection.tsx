import React, { useState } from "react";
import { ButtonFullWidth } from "@/components/ui/button-full-width";
import { Typography } from "@/components/ui/typography";
import { HandHeart } from "lucide-react";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { useLeaderboardData } from "@/hooks/useLeaderboardOptimized";
import { RewardsCalculationService } from "@/app/services/rewardsCalculationService";
import { CheckCircle, AlertCircle } from "lucide-react";

export function PayItForwardSection() {
  const [isOptingOut, setIsOptingOut] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { talentUuid } = useFidToTalentUuid();
  const { entries: top200Entries, refetch } = useLeaderboardData();

  const userTop200Entry = top200Entries.find(
    (entry) => entry.talent_protocol_id === talentUuid,
  );

  const isAlreadyOptedOut = Boolean(userTop200Entry?.isOptedOut);
  const hasPaidForward = success || isAlreadyOptedOut;

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
        // Success - show success state and refresh leaderboard data
        refetch(); // Refresh leaderboard data to show updated opt-out status
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

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="space-y-4">
          {/* Description: Explains what the feature does and its benefits */}
          <Typography size="base" className="text-foreground">
            Give your rewards back to other creators, keep your leaderboard
            position and earn a special badge.
          </Typography>

          {/* Current Rewards Display: Shows user's potential rewards amount */}
          <div className="flex items-center justify-between">
            <Typography size="base" weight="medium">
              Your Rewards
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
                I understand that I am donating all my rewards and this decision
                cannot be reversed.
              </label>
            </div>
          ) : null}

          {/* Action Button: Main CTA that processes the opt-out request */}
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
        </div>
      </div>
    </div>
  );
}

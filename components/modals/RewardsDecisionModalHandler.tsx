"use client";

import { useAutoModal } from "@/hooks/useAutoModal";
import { RewardsDecisionModal } from "./RewardsDecisionModal";

interface RewardsDecisionModalHandlerProps {
  userRank?: number;
  userEarnings?: number;
  hasVerifiedWallets?: boolean;
  optedOutPercentage?: number;
}

export function RewardsDecisionModalHandler({
  userRank,
  userEarnings,
  hasVerifiedWallets = true,
  optedOutPercentage,
}: RewardsDecisionModalHandlerProps) {
  const { onOpenChange } = useAutoModal({
    storageKey: "rewards-decision",
    databaseField: "rewards_decision_modal_seen",
    autoOpen: false, // Don't auto-open for now
  });

  // For testing, we'll always show the modal
  // TODO: Implement proper logic to check if user is in top 200
  const modalOpen = true;

  return (
    <RewardsDecisionModal
      open={modalOpen}
      onOpenChange={onOpenChange}
      userRank={userRank}
      userEarnings={userEarnings}
      hasVerifiedWallets={hasVerifiedWallets}
      optedOutPercentage={optedOutPercentage}
    />
  );
}

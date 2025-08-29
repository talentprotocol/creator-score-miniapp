"use client";

import { RewardsDecisionModal } from "@/components/modals/RewardsDecisionModal";
import { useUserRewardsDecision } from "@/hooks/useUserRewardsDecision";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { LeaderboardEntry } from "@/app/services/types";

interface RewardsDecisionModalHandlerProps {
  userTop200Entry?: LeaderboardEntry;
}

export function RewardsDecisionModalHandler({
  userTop200Entry,
}: RewardsDecisionModalHandlerProps) {
  const { talentUuid } = useFidToTalentUuid();

  // Check if user has made a rewards decision
  const { data: rewardsDecision, loading } = useUserRewardsDecision(
    talentUuid,
    userTop200Entry,
  );

  // Debug logging
  console.log("[RewardsDecisionModalHandler] Debug info:", {
    userTop200Entry,
    talentUuid,
    rewardsDecision,
    loading,
    hasUserTop200Entry: Boolean(userTop200Entry),
    hasMadeDecision: rewardsDecision.hasMadeDecision,
    shouldShow: Boolean(
      userTop200Entry &&
        !rewardsDecision.hasMadeDecision &&
        !loading &&
        talentUuid,
    ),
  });

  // Only show modal if:
  // 1. User is in top 200 (has userTop200Entry)
  // 2. User hasn't made a decision yet
  // 3. Not loading
  const shouldShowModal = Boolean(
    userTop200Entry &&
      !rewardsDecision.hasMadeDecision &&
      !loading &&
      talentUuid,
  );

  // Get user's rank from leaderboard entry
  const userRank = userTop200Entry?.rank;

  if (!shouldShowModal) {
    return null;
  }

  return (
    <RewardsDecisionModal
      open={shouldShowModal}
      onOpenChange={() => {}} // No-op for now
      talentUuid={talentUuid!}
      userRank={userRank}
    />
  );
}

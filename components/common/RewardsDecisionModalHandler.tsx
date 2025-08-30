"use client";

import * as React from "react";
import { useProfileWalletAccounts } from "@/hooks/useProfileWalletAccounts";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { useUserRewardsDecision } from "@/hooks/useUserRewardsDecision";
import { RewardsDecisionModal } from "@/components/modals/RewardsDecisionModal";

interface RewardsDecisionModalHandlerProps {
  userRank?: number;
  userRewards?: number;
  isTop200?: boolean;
}

export function RewardsDecisionModalHandler({
  userRank,
  userRewards,
  isTop200 = false,
}: RewardsDecisionModalHandlerProps) {
  const { talentUuid } = useFidToTalentUuid();
  const { data: rewardsDecisionData, loading: decisionLoading } =
    useUserRewardsDecision(talentUuid);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [hasCheckedDecision, setHasCheckedDecision] = React.useState(false);

  const { walletData, loading: walletsLoading } = useProfileWalletAccounts(
    talentUuid || undefined,
  );

  // Fetch profile data to get primary wallet address
  const [profileData, setProfileData] = React.useState<{
    farcaster_primary_wallet_address?: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(false);

  // Calculate opted-out percentage
  const [optedOutPercentage, setOptedOutPercentage] =
    React.useState<number>(58);

  React.useEffect(() => {
    if (!talentUuid) return;

    async function fetchProfile() {
      setProfileLoading(true);
      try {
        const response = await fetch(`/api/talent-user?id=${talentUuid}`);
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setProfileLoading(false);
      }
    }

    async function calculatePercentage() {
      try {
        const response = await fetch(
          "/api/user-preferences/opted-out-percentage",
        );
        if (response.ok) {
          const data = await response.json();
          setOptedOutPercentage(data.percentage);
        }
      } catch (error) {
        console.error("Error calculating opted-out percentage:", error);
        // Keep default 58% if calculation fails
      }
    }

    fetchProfile();
    calculatePercentage();
  }, [talentUuid]);

  // Check if modal should be shown - only show if user is in top 200 and hasn't made a decision
  React.useEffect(() => {
    if (!isTop200 || !talentUuid || decisionLoading || hasCheckedDecision) {
      return;
    }

    // If user has already made a decision, don't show modal
    if (rewardsDecisionData.hasMadeDecision) {
      setHasCheckedDecision(true);
      return;
    }

    // Show modal for top 200 users who haven't made a decision
    setIsModalOpen(true);
    setHasCheckedDecision(true);
  }, [
    isTop200,
    talentUuid,
    decisionLoading,
    rewardsDecisionData.hasMadeDecision,
    hasCheckedDecision,
  ]);

  // Handle modal close - don't update database, just close the modal
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setIsModalOpen(false);
    }
  };

  // Don't render if not in top 200 or modal shouldn't be shown
  if (!isTop200 || !isModalOpen) {
    return null;
  }

  // Transform wallet data for the modal
  const wallets = walletData
    ? [
        // Farcaster verified wallets - mark primary address
        ...walletData.farcasterVerified.map((wallet) => ({
          address: wallet.identifier,
          label:
            wallet.identifier === profileData?.farcaster_primary_wallet_address
              ? "Farcaster Primary"
              : "Farcaster Verified",
          type:
            wallet.identifier === profileData?.farcaster_primary_wallet_address
              ? ("farcaster-primary" as const)
              : ("farcaster-verified" as const),
        })),
        // Talent verified wallets
        ...walletData.talentVerified.map((wallet) => ({
          address: wallet.identifier,
          label: "Talent Verified",
          type: "talent-verified" as const,
        })),
      ]
    : [];

  return (
    <RewardsDecisionModal
      open={isModalOpen}
      onOpenChange={handleModalClose}
      userRank={userRank}
      userRewards={userRewards}
      optedOutPercentage={optedOutPercentage}
      wallets={wallets}
      isLoading={walletsLoading || profileLoading}
      talentUuid={talentUuid || undefined}
    />
  );
}

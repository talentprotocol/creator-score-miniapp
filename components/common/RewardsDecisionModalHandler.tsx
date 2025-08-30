"use client";

import * as React from "react";
import { useAutoModal } from "@/hooks/useAutoModal";
import { useProfileWalletAccounts } from "@/hooks/useProfileWalletAccounts";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
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
  const { onOpenChange } = useAutoModal({
    storageKey: "rewards-decision",
    databaseField: "rewards_decision",
    autoOpen: false, // Don't auto-open for now
  });

  const { talentUuid } = useFidToTalentUuid();
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

  // Check if user has already made a decision
  const [hasMadeDecision, setHasMadeDecision] = React.useState<boolean | null>(
    null,
  );
  const [decisionLoading, setDecisionLoading] = React.useState(false);

  React.useEffect(() => {
    if (!talentUuid) return;

    async function checkDecision() {
      setDecisionLoading(true);
      try {
        const response = await fetch(
          `/api/user-preferences/optout?talent_uuid=${talentUuid}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const decision = data.data?.rewards_decision;
            setHasMadeDecision(decision !== null && decision !== undefined);
          }
        }
      } catch (error) {
        console.error("Error checking decision status:", error);
      } finally {
        setDecisionLoading(false);
      }
    }

    checkDecision();
  }, [talentUuid]);

  // Only show modal if user is in top 200 and hasn't made a decision
  const shouldShowModal = isTop200 && !hasMadeDecision;
  const modalOpen = shouldShowModal;

  // Don't render if not in top 200
  if (!shouldShowModal) {
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
      open={modalOpen}
      onOpenChange={onOpenChange}
      userRank={userRank}
      userRewards={userRewards}
      optedOutPercentage={optedOutPercentage}
      wallets={wallets}
      isLoading={walletsLoading || profileLoading || decisionLoading}
      talentUuid={talentUuid || undefined}
    />
  );
}

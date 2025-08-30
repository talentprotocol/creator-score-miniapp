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
  const { isOpen, onOpenChange } = useAutoModal({
    databaseField: "rewards_decision",
    autoOpen: true, // Enable auto-opening based on database field
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

  // Only show modal if user is in top 200 and useAutoModal says to show it
  const shouldShowModal = isTop200 && isOpen;

  // Don't render if not in top 200 or modal shouldn't be shown
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
      open={isOpen}
      onOpenChange={onOpenChange}
      userRank={userRank}
      userRewards={userRewards}
      optedOutPercentage={optedOutPercentage}
      wallets={wallets}
      isLoading={walletsLoading || profileLoading}
      talentUuid={talentUuid || undefined}
    />
  );
}

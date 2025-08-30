"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Coins, HandHeart, ArrowLeft, Wallet, Loader2 } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { ACTIVE_SPONSORS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { WalletSelectionStep } from "@/components/modals/WalletSelectionStep";

interface RewardsDecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRank?: number;
  userRewards?: number;
  optedOutPercentage?: number;
  wallets?: Array<{
    address: string;
    label: string;
    type: "farcaster-primary" | "farcaster-verified" | "talent-verified";
  }>;
  isLoading?: boolean;
  talentUuid?: string;
}

function RewardsDecisionContent({
  userRank,
  userRewards,
  optedOutPercentage,
  wallets = [],
  isLoading = false,
  talentUuid,
  onOpenChange,
}: {
  userRank?: number;
  userRewards?: number;
  optedOutPercentage?: number;
  wallets?: Array<{
    address: string;
    label: string;
    type: "farcaster-primary" | "farcaster-verified" | "talent-verified";
  }>;
  isLoading?: boolean;
  talentUuid?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedWallet, setSelectedWallet] = React.useState("");
  const [copiedAddress, setCopiedAddress] = React.useState<
    string | undefined
  >();

  // Sponsor names for display
  const sponsorNames = ACTIVE_SPONSORS.map((s) => s.name).join(", ");

  const handlePayItForwardClick = () => {
    router.push("/settings?section=pay-it-forward");
  };

  const handleKeepRewardsClick = () => {
    setCurrentStep(2);
  };

  const handleBackClick = () => {
    setCurrentStep(1);
  };

  const handleConfirmAddress = async () => {
    if (!selectedWallet) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/user-preferences/optout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          talent_uuid: talentUuid,
          decision: "opted_in",
          confirm_decision: true,
          primary_wallet_address: selectedWallet,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Close modal on success
        onOpenChange(false);
      } else {
        console.error("Failed to save decision:", result.error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error("Error saving decision:", error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWalletSelect = (address: string) => {
    setSelectedWallet(address);
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(undefined), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  // Step 1: Decision Selection
  if (currentStep === 1) {
    return (
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <>
            {/* Congratulations Message */}
            <div className="space-y-3">
              <Typography size="base" weight="medium">
                Congratulations for being a top 200 onchain creator!
              </Typography>

              {userRank && userRewards ? (
                <Typography size="sm" color="muted">
                  You ranked #{userRank} and earned {userRewards} USDC.
                </Typography>
              ) : (
                <Typography size="sm" color="muted">
                  You ranked in the top 200 and earned USDC rewards.
                </Typography>
              )}
            </div>

            {/* Sponsor Recognition */}
            <div className="space-y-3">
              <Typography size="sm" color="muted">
                Rewards are sponsored by {sponsorNames}.
              </Typography>
            </div>

            {/* Explanation */}
            <div className="space-y-3">
              <Typography size="sm" color="muted">
                You can opt-in to receive your rewards on Sep 17th or pay them
                forward to onchain creators* and earn a special badge.
              </Typography>

              {optedOutPercentage !== undefined && (
                <Typography size="sm" color="muted">
                  {optedOutPercentage}% of creators are already paying forward.
                </Typography>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="brand-purple"
                onClick={handleKeepRewardsClick}
                className="flex-1"
              >
                <Coins className="h-4 w-4 mr-2" />
                Keep My Rewards
              </Button>

              <Button
                variant="brand-green"
                onClick={handlePayItForwardClick}
                className="flex-1"
              >
                <HandHeart className="h-4 w-4 mr-2" />
                Pay It Forward
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Step 2: Wallet Selection
  return (
    <div className="space-y-6">
      {/* Wallet Selection Content */}
      <div className="space-y-3">
        <Typography size="sm" color="muted">
          Choose the wallet address where you&apos;d like to receive your USDC
          rewards on Base.
        </Typography>

        <WalletSelectionStep
          wallets={wallets}
          selectedWallet={selectedWallet}
          onWalletSelect={handleWalletSelect}
          onCopyAddress={handleCopyAddress}
          copiedAddress={copiedAddress}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="default" onClick={handleBackClick} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          variant="brand-purple"
          onClick={handleConfirmAddress}
          disabled={isSubmitting || !selectedWallet}
          className="flex-1"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Wallet className="h-4 w-4 mr-2" />
          )}
          {isSubmitting ? "Processing..." : "Confirm Address"}
        </Button>
      </div>
    </div>
  );
}

export function RewardsDecisionModal({
  open,
  onOpenChange,
  userRank,
  userRewards,
  optedOutPercentage,
  wallets,
  isLoading,
  talentUuid,
}: RewardsDecisionModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent disableOutsideClick disableEscapeKey>
          <DialogHeader>
            <DialogTitle>Creator Score Rewards</DialogTitle>
            <DialogDescription>
              {open ? "Claim your USDC or Pay It Forward" : ""}
            </DialogDescription>
          </DialogHeader>
          <RewardsDecisionContent
            userRank={userRank}
            userRewards={userRewards}
            optedOutPercentage={optedOutPercentage}
            wallets={wallets}
            isLoading={isLoading}
            talentUuid={talentUuid}
            onOpenChange={onOpenChange}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Creator Score Rewards</DrawerTitle>
          <DrawerDescription>
            Claim your USDC or Pay It Forward
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-8">
          <RewardsDecisionContent
            userRank={userRank}
            userRewards={userRewards}
            optedOutPercentage={optedOutPercentage}
            wallets={wallets}
            isLoading={isLoading}
            talentUuid={talentUuid}
            onOpenChange={onOpenChange}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

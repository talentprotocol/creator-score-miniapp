"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Coins,
  HandHeart,
  ArrowLeft,
  Wallet,
  Loader2,
  Check,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { ACTIVE_SPONSORS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { WalletSelectionStep } from "@/components/modals/WalletSelectionStep";
import type { RewardsDecision } from "@/lib/types/user-preferences";

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
  isInTop200?: boolean;
  rewardsDecision?: RewardsDecision;
  onOptInSuccess?: () => void;
}

function RewardsDecisionContent({
  userRank,
  userRewards,
  optedOutPercentage,
  wallets = [],
  isLoading = false,
  talentUuid,
  isInTop200 = false,
  rewardsDecision = null,
  onOpenChange,
  onOptInSuccess,
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
  isInTop200?: boolean;
  rewardsDecision?: RewardsDecision;
  onOpenChange: (open: boolean) => void;
  onOptInSuccess?: () => void;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedWallet, setSelectedWallet] = React.useState("");
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [copiedAddress, setCopiedAddress] = React.useState<
    string | undefined
  >();

  // Auto-select the most appropriate wallet when wallets are available
  React.useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      // Priority: Farcaster primary > Farcaster verified > Talent verified
      const farcasterPrimary = wallets.find(
        (w) => w.type === "farcaster-primary",
      );
      const farcasterVerified = wallets.find(
        (w) => w.type === "farcaster-verified",
      );
      const talentVerified = wallets.find((w) => w.type === "talent-verified");

      const defaultWallet =
        farcasterPrimary || farcasterVerified || talentVerified;
      if (defaultWallet) {
        setSelectedWallet(defaultWallet.address);
      }
    }
  }, [wallets, selectedWallet]);

  // Sponsor names for display
  const sponsorNames = ACTIVE_SPONSORS.map((s) => s.name).join(", ");

  // Derived state for cleaner logic
  const hasMadeDecision = rewardsDecision !== null;
  const isOptedOut = rewardsDecision === "opted_out";

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
        // Show success state
        setIsSuccess(true);
        // Trigger refresh of rewards decision data immediately
        onOptInSuccess?.();
        // Auto-close after 3 seconds (increased from 2)
        setTimeout(() => onOpenChange(false), 3000);
      } else {
        // TODO: Show error message to user
      }
    } catch {
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
    } catch {
      // Failed to copy address
    }
  };

  // Determine content based on user's situation
  const getModalContent = () => {
    // Loading State
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    // Scenario 1: User IS in top 200 AND hasn't made decision
    if (isInTop200 && !hasMadeDecision) {
      return (
        <>
          {/* Rank and Rewards */}
          <div className="space-y-3">
            {userRank && userRewards ? (
              <Typography
                size="base"
                weight="medium"
                className="text-brand-purple"
              >
                You ranked #{userRank} and earned ${userRewards} in rewards!
              </Typography>
            ) : (
              <Typography
                size="base"
                weight="medium"
                className="text-brand-purple"
              >
                <br />
                You ranked in the top 200 and earned USDC rewards!
              </Typography>
            )}
          </div>

          {/* Explanation */}
          <div className="space-y-3">
            <Typography size="sm" color="default">
              Choose between:
              <br />
              • Receiving your rewards on Sep 17th
              <br />• Paying it forward to more creators
            </Typography>

            <Typography size="sm" color="muted">
              {optedOutPercentage}% of top 200 creators paid it forward so far.
            </Typography>
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
      );
    }

    // Scenario 2: User HAS made a decision
    if (hasMadeDecision) {
      return (
        <>
          {/* Rank and Rewards */}
          <div className="space-y-3">
            {userRank && userRank > 0 && userRewards ? (
              <Typography
                size="base"
                weight="medium"
                className="text-brand-purple"
              >
                You ranked #{userRank} and earned ${userRewards} in rewards!
              </Typography>
            ) : userRank === -1 && userRewards ? (
              <Typography
                size="base"
                weight="medium"
                className="text-brand-purple"
              >
                You ranked in the top 200 and earned ${userRewards} in rewards!
              </Typography>
            ) : (
              <Typography
                size="base"
                weight="medium"
                className="text-brand-purple"
              >
                You didn&apos;t qualify for rewards this time. Thanks for paying it forward!
              </Typography>
            )}
          </div>

          {/* Decision Status */}
          <div className="space-y-3">
            {isOptedOut ? (
              <Typography size="sm" color="muted">
                You&apos;re part of the {optedOutPercentage}% of creators who
                paid it forward.
              </Typography>
            ) : (
              <Typography size="sm" color="default">
                You opted-in to receive USDC rewards on Sep 17th.
              </Typography>
            )}
          </div>

          {/* Disabled Action Buttons */}
          <div className="flex gap-3">
            <Button variant="brand-purple" disabled className="flex-1">
              <Coins className="h-4 w-4 mr-2" />
              Keep My Rewards
            </Button>

            <Button variant="brand-green" disabled className="flex-1">
              <HandHeart className="h-4 w-4 mr-2" />
              Pay It Forward
            </Button>
          </div>
        </>
      );
    }

    // Scenario 3: User is NOT in top 200
    return (
      <>
        {/* Creator Score */}
        <div className="space-y-3">
          <Typography size="base" weight="medium" className="text-brand-purple">
            Your Creator Score is {userRewards || 0}.
          </Typography>
        </div>

        {/* Explanation */}
        <div className="space-y-3">
          <Typography size="sm" color="default">
            Unfortunately you didn&apos;t qualify for rewards this time.
          </Typography>

          <Typography size="sm" color="muted">
            Rewards are sponsored by {sponsorNames}.
          </Typography>
        </div>

        {/* Disabled Action Buttons */}
        <div className="flex gap-3">
          <Button variant="brand-purple" disabled className="flex-1">
            <Coins className="h-4 w-4 mr-2" />
            Keep My Rewards
          </Button>

          <Button variant="brand-green" disabled className="flex-1">
            <HandHeart className="h-4 w-4 mr-2" />
            Pay It Forward
          </Button>
        </div>
      </>
    );
  };

  // Step 1: Decision Selection
  if (currentStep === 1) {
    return <div className="space-y-6">{getModalContent()}</div>;
  }

  // Step 2: Wallet Selection
  return (
    <div className="space-y-6">
      {/* Success State */}
      {isSuccess ? (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <Typography size="lg" weight="medium">
            Success!
          </Typography>

          <div className="space-y-2">
            <Typography size="sm" color="muted">
              Your USDC rewards will be sent to:
            </Typography>
            <Typography
              size="sm"
              className="font-mono bg-muted/50 px-3 py-2 rounded"
            >
              {selectedWallet.slice(0, 6)}...{selectedWallet.slice(-4)}
            </Typography>
            <Typography size="xs" color="muted">
              Distribution: Sep 17th, 2025
            </Typography>
          </div>
        </div>
      ) : (
        <>
          {/* Wallet Selection Content */}
          <div className="space-y-3">
            <Typography size="sm" color="muted">
              Choose the Base address where you&apos;d like to receive USDC.
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
            <Button
              variant="default"
              onClick={handleBackClick}
              className="flex-1"
            >
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
        </>
      )}
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
  isInTop200,
  rewardsDecision,
  onOptInSuccess,
}: RewardsDecisionModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent disableOutsideClick disableEscapeKey>
          <DialogHeader>
            <DialogTitle>Creator Score Rewards</DialogTitle>
          </DialogHeader>
          <RewardsDecisionContent
            userRank={userRank}
            userRewards={userRewards}
            optedOutPercentage={optedOutPercentage}
            wallets={wallets}
            isLoading={isLoading}
            talentUuid={talentUuid}
            isInTop200={isInTop200}
            rewardsDecision={rewardsDecision}
            onOpenChange={onOpenChange}
            onOptInSuccess={onOptInSuccess}
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
        </DrawerHeader>
        <div className="px-4 pb-8">
          <RewardsDecisionContent
            userRank={userRank}
            userRewards={userRewards}
            optedOutPercentage={optedOutPercentage}
            wallets={wallets}
            isLoading={isLoading}
            talentUuid={talentUuid}
            isInTop200={isInTop200}
            rewardsDecision={rewardsDecision}
            onOpenChange={onOpenChange}
            onOptInSuccess={onOptInSuccess}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

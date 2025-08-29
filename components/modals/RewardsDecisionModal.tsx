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
import { WalletSelectionStep } from "./WalletSelectionStep";

interface RewardsDecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRank?: number;
  userEarnings?: number;
  hasVerifiedWallets?: boolean;
  optedOutPercentage?: number;
}

function RewardsDecisionContent({
  userRank,
  userEarnings,
  hasVerifiedWallets,
  optedOutPercentage,
}: {
  userRank?: number;
  userEarnings?: number;
  hasVerifiedWallets?: boolean;
  optedOutPercentage?: number;
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
    // TODO: Implement decision saving with selected wallet
    // For now, just close the modal
    setTimeout(() => {
      setIsSubmitting(false);
      // Close modal logic will be handled by parent
    }, 1000);
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
        {/* Congratulations Message */}
        <div className="space-y-3">
          <Typography size="base" weight="medium">
            Congratulations for being a top 200 onchain creator!
          </Typography>

          {userRank && userEarnings ? (
            <Typography size="sm" color="muted">
              You ranked #{userRank} and earned {userEarnings} USDC.
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
            disabled={!hasVerifiedWallets}
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

        {/* No Verified Wallets Message */}
        {!hasVerifiedWallets && (
          <Typography size="sm" color="muted" className="text-center">
            Verify one wallet address on Talent Protocol.
          </Typography>
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
          wallets={[
            {
              address: "0x1234567890abcdef1234567890abcdef12345678",
              label: "Farcaster Primary",
              type: "farcaster-primary",
            },
            {
              address: "0xabcdef1234567890abcdef1234567890abcdef12",
              label: "Talent Verified",
              type: "talent-verified",
            },
          ]}
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
  userEarnings,
  hasVerifiedWallets = true,
  optedOutPercentage,
}: RewardsDecisionModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Creator Score Rewards</DialogTitle>
            <DialogDescription>
              {open ? "Claim your USDC or Pay It Forward" : ""}
            </DialogDescription>
          </DialogHeader>
          <RewardsDecisionContent
            userRank={userRank}
            userEarnings={userEarnings}
            hasVerifiedWallets={hasVerifiedWallets}
            optedOutPercentage={optedOutPercentage}
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
            userEarnings={userEarnings}
            hasVerifiedWallets={hasVerifiedWallets}
            optedOutPercentage={optedOutPercentage}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

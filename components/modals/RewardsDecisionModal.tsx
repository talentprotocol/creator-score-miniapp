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
import { Coins, HandHeart, Loader2 } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { SponsorRecognition } from "@/components/common/SponsorRecognition";
import { WalletSelectionStep } from "@/components/modals/WalletSelectionStep";

interface RewardsDecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talentUuid: string;
  userRank?: number;
}

type ModalStep = "decision" | "wallet-selection";

function RewardsDecisionContent({
  talentUuid,
  userRank,
  onStepChange,
}: {
  talentUuid: string;
  userRank?: number;
  onStepChange: (step: ModalStep) => void;
}) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState<ModalStep>("decision");

  const handleDecision = async (selectedDecision: "opted_in" | "opted_out") => {
    if (selectedDecision === "opted_in") {
      // Move to wallet selection step
      setCurrentStep("wallet-selection");
      onStepChange("wallet-selection");
    } else {
      // Submit opt-out decision immediately
      await submitDecision(selectedDecision);
    }
  };

  const submitDecision = async (selectedDecision: "opted_in" | "opted_out") => {
    setIsSubmitting(true);

    try {
      // Track analytics
      posthog?.capture("rewards_decision_submitted", {
        decision: selectedDecision,
        location: "rewards_decision_modal",
        user_rank: userRank,
      });

      const response = await fetch("/api/user-preferences/optout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          talent_uuid: talentUuid,
          decision: selectedDecision,
          confirm_decision: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit decision: ${response.status}`);
      }

      // Track success
      posthog?.capture("rewards_decision_success", {
        decision: selectedDecision,
        location: "rewards_decision_modal",
        user_rank: userRank,
      });

      // Close modal on success
      router.refresh(); // Refresh to update UI
    } catch (error) {
      console.error("Error submitting decision:", error);

      // Track error
      posthog?.capture("rewards_decision_error", {
        decision: selectedDecision,
        location: "rewards_decision_modal",
        user_rank: userRank,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToDecision = () => {
    setCurrentStep("decision");
    onStepChange("decision");
  };

  const handleWalletSelectionComplete = () => {
    // Submit opt-in decision after wallet selection
    submitDecision("opted_in");
  };

  if (currentStep === "wallet-selection") {
    return (
      <WalletSelectionStep
        talentUuid={talentUuid}
        onBack={handleBackToDecision}
        onComplete={handleWalletSelectionComplete}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with rank info */}
      {userRank && (
        <div className="text-center p-4 bg-brand-purple-light rounded-lg">
          <p className="text-sm text-brand-purple">
            🎉 Congratulations! You&apos;re in the Top 200 (#{userRank})
          </p>
        </div>
      )}

      {/* Decision Step */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">
            Choose Your Rewards Path
          </h3>
          <p className="text-sm text-muted-foreground">
            You&apos;ve earned rewards! Decide how you want to receive them.
          </p>
        </div>

        {/* Opt-in Option */}
        <div className="p-4 border-2 border-brand-purple rounded-lg hover:border-brand-purple/80 transition-colors">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-purple-light rounded-lg mt-1">
              <Coins className="h-5 w-5 text-brand-purple" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-brand-purple mb-1">
                Opt In & Receive USDC
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Get paid directly to your wallet in September. You&apos;ll need
                to select which wallet to receive rewards.
              </p>
              <Button
                variant="brand-purple"
                onClick={() => handleDecision("opted_in")}
                disabled={isSubmitting}
                className="w-full"
              >
                <Coins className="h-4 w-4 mr-2" />
                Opt In & Select Wallet
              </Button>
            </div>
          </div>
        </div>

        {/* Opt-out Option */}
        <div className="p-4 border-2 border-brand-green rounded-lg hover:border-brand-green/80 transition-colors">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-green-light rounded-lg mt-1">
              <HandHeart className="h-5 w-5 text-brand-green" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-brand-green mb-1">
                Pay It Forward
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Your rewards go to support other creators. You can change this
                decision later in settings.
              </p>
              <Button
                variant="brand-green"
                onClick={() => handleDecision("opted_out")}
                disabled={isSubmitting}
                className="w-full"
              >
                <HandHeart className="h-4 w-4 mr-2" />
                Pay It Forward
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsor Recognition */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-center">
          Made possible by our sponsors
        </h4>
        <SponsorRecognition />
      </div>

      {/* Loading State */}
      {isSubmitting && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing your decision...
        </div>
      )}
    </div>
  );
}

export function RewardsDecisionModal({
  open,
  onOpenChange,
  talentUuid,
  userRank,
}: RewardsDecisionModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [currentStep, setCurrentStep] = React.useState<ModalStep>("decision");

  const handleStepChange = (step: ModalStep) => {
    setCurrentStep(step);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset to decision step when closing
      setCurrentStep("decision");
    }
    onOpenChange(newOpen);
  };

  const getModalTitle = () => {
    if (currentStep === "wallet-selection") {
      return "Select Wallet for Rewards";
    }
    return "Rewards Decision";
  };

  const getModalDescription = () => {
    if (currentStep === "wallet-selection") {
      return "Choose which wallet will receive your USDC rewards.";
    }
    return "You're in the Top 200! Choose how to receive your rewards.";
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
            <DialogDescription>{getModalDescription()}</DialogDescription>
          </DialogHeader>
          <RewardsDecisionContent
            talentUuid={talentUuid}
            userRank={userRank}
            onStepChange={handleStepChange}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{getModalTitle()}</DrawerTitle>
          <DrawerDescription>{getModalDescription()}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-8">
          <RewardsDecisionContent
            talentUuid={talentUuid}
            userRank={userRank}
            onStepChange={handleStepChange}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

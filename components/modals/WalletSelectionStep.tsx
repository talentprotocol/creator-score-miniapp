"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, Loader2 } from "lucide-react";

interface WalletSelectionStepProps {
  talentUuid: string;
  onBack: () => void;
  onComplete: () => void;
  isSubmitting: boolean;
}

export function WalletSelectionStep({
  onBack,
  onComplete,
  isSubmitting,
}: WalletSelectionStepProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);

  // For now, we'll skip the actual wallet loading logic
  // TODO: Implement when database schema is ready
  const isLoading = false;

  const handleSubmit = async () => {
    // For now, skip wallet selection and proceed with opt-in
    // TODO: Implement wallet selection when database schema is ready
    setIsProcessing(true);

    try {
      // Simulate wallet selection for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Call completion handler
      onComplete();
    } catch (error) {
      console.error("Error in wallet selection:", error);
      // Reset processing state to allow retry
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading wallets...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          Select Wallet for Rewards
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose which wallet will receive your USDC rewards in September.
        </p>
      </div>

      {/* Wallet Selection Placeholder */}
      <div className="p-4 border-2 border-dashed border-muted-foreground rounded-lg">
        <div className="text-center">
          <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Wallet selection will be implemented in the next phase
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            For now, proceeding with default wallet
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="default"
          onClick={onBack}
          disabled={isProcessing || isSubmitting}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button
          variant="brand-purple"
          onClick={handleSubmit}
          disabled={isProcessing || isSubmitting}
          className="flex-1"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Wallet className="h-4 w-4 mr-2" />
          )}
          {isProcessing ? "Processing..." : "Continue with Opt-in"}
        </Button>
      </div>

      {/* Info Text */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          You can change this wallet later in your settings.
        </p>
      </div>
    </div>
  );
}

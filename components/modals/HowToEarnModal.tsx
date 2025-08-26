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
import {
  Link2,
  Trophy,
  Coins,
  Rocket,
  HandHeart,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { BOOST_CONFIG } from "@/lib/constants";
import {
  handleGetTalent,
  DEFAULT_TALENT_SWAP_URL,
  SwapResult,
} from "@/lib/talent-swap";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

interface HowToEarnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function HowToEarnContent() {
  const router = useRouter();
  const [swapResult, setSwapResult] = React.useState<SwapResult>({
    state: "idle",
  });

  const handleSwapClick = async () => {
    // Track analytics
    posthog?.capture("get_talent_button_clicked", {
      location: "how_to_earn_modal",
    });

    await handleGetTalent(DEFAULT_TALENT_SWAP_URL, setSwapResult);
  };

  const resetSwapState = () => {
    setSwapResult({ state: "idle" });
  };

  const handlePayItForwardClick = () => {
    // Track analytics
    posthog?.capture("pay_it_forward_navigation_clicked", {
      location: "how_to_earn_modal",
    });

    // Navigate to settings page with Pay It Forward section expanded
    router.push("/settings?section=pay-it-forward");
  };

  return (
    <div className="space-y-6">
      {/* Steps */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-brand-purple-light rounded-lg">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm">Connect your Creator Accounts</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-2 bg-brand-purple-light rounded-lg">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm">Reach the Top 200 Leaderboard</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-2 bg-brand-purple-light rounded-lg">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm">
            Hold {BOOST_CONFIG.TOKEN_THRESHOLD}+ $TALENT for a 10% Boost
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-2 bg-brand-purple-light rounded-lg">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm">Get Paid USDC in September, or…</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-2 bg-brand-purple-light rounded-lg">
            <HandHeart className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm">Opt-out of Rewards to Support Creators</p>
        </div>
      </div>

      {/* Swap feedback message */}
      {swapResult.state !== "idle" && (
        <div
          className={`p-4 rounded-lg border ${
            swapResult.state === "success"
              ? "bg-success-light border-success text-success"
              : swapResult.state === "loading"
                ? "bg-info-light border-info text-info"
                : swapResult.state === "rejected"
                  ? "bg-warning-light border-warning text-warning"
                  : "bg-error-light border-error text-error"
          }`}
        >
          <div className="flex items-center gap-2">
            {swapResult.state === "loading" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {swapResult.state === "success" && (
              <CheckCircle className="h-4 w-4" />
            )}
            {(swapResult.state === "error" ||
              swapResult.state === "rejected") && (
              <XCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {swapResult.state === "loading" && "Processing swap..."}
              {swapResult.state === "success" && "Swap Successful!"}
              {swapResult.state === "error" && "Swap Failed"}
              {swapResult.state === "rejected" && "Swap Cancelled"}
            </span>
          </div>
          {swapResult.message && (
            <p className="text-xs mt-1 opacity-80">{swapResult.message}</p>
          )}
          {swapResult.state !== "loading" && (
            <button
              onClick={resetSwapState}
              className="text-xs underline mt-2 opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="brand-purple"
          onClick={handleSwapClick}
          disabled={swapResult.state === "loading"}
          className="flex-1"
        >
          {swapResult.state === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Coins className="h-4 w-4 mr-2" />
          )}
          {swapResult.state === "loading" ? "Processing..." : "Get $TALENT"}
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
    </div>
  );
}

export function HowToEarnModal({ open, onOpenChange }: HowToEarnModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How to Earn Rewards</DialogTitle>
            <DialogDescription>
              Follow these steps to earn USDC on Base.
            </DialogDescription>
          </DialogHeader>
          <HowToEarnContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>How to Earn Rewards</DrawerTitle>
          <DrawerDescription>
            Follow these steps to earn USDC on Base.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-8">
          <HowToEarnContent />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

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
import { useMediaQuery } from "@/hooks/use-media-query";
import { ButtonFullWidth } from "@/components/ui/button-full-width";
import { Coins, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatTokenAmount } from "@/lib/utils";
import { BOOST_CONFIG } from "@/lib/constants";
import {
  handleGetTalent,
  DEFAULT_TALENT_SWAP_URL,
  SwapResult,
} from "@/lib/talent-swap";

interface RewardBoostsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewardUsd: string; // base reward without boost, pre-formatted
  tokenBalance?: number | null;
  boostUsd: string; // boost amount, pre-formatted
  totalUsd: string; // total reward with boost applied, pre-formatted
  rank?: number;
  score: number;
}

function Content({
  rewardUsd,
  tokenBalance,
  boostUsd,
  totalUsd,
  rank,
  score,
}: Omit<RewardBoostsModalProps, "open" | "onOpenChange">) {
  const [swapResult, setSwapResult] = React.useState<SwapResult>({
    state: "idle",
  });

  const tokenNumber =
    tokenBalance !== null && tokenBalance !== undefined ? tokenBalance : 0;
  const tokenDisplay = `${formatTokenAmount(tokenNumber)}`;
  const isTop200 = typeof rank === "number" && rank <= 200;
  const rewardDisplay = isTop200 ? rewardUsd : "Not eligible";
  const boostDisplay = (() => {
    if (tokenNumber < BOOST_CONFIG.TOKEN_THRESHOLD) return "Not eligible";
    if (!isTop200) return "$0";
    return boostUsd || "$0";
  })();

  const handleSwapClick = async () => {
    await handleGetTalent(DEFAULT_TALENT_SWAP_URL, setSwapResult);
  };

  const resetSwapState = () => {
    setSwapResult({ state: "idle" });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Your Rewards
        </p>
        <div className="space-y-2">
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Creator Reward</span>
            <span>{rewardDisplay}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Boost Amount</span>
            <span>{boostDisplay}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-purple">Total Reward</span>
            <span className="font-medium text-brand-purple">{totalUsd}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Your Stats
        </p>
        <div className="space-y-2">
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Creator Rank</span>
            <span>{isTop200 ? `#${rank}` : "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Creator Score</span>
            <span>{score ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">$TALENT Tokens</span>
            <span>{tokenDisplay}</span>
          </div>
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

      <ButtonFullWidth
        variant="brand-purple"
        icon={
          swapResult.state === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Coins className="h-4 w-4" />
          )
        }
        align="left"
        onClick={handleSwapClick}
        disabled={swapResult.state === "loading"}
      >
        {swapResult.state === "loading" ? "Processing..." : "Get $TALENT"}
      </ButtonFullWidth>
    </div>
  );
}

export function RewardBoostsModal(props: RewardBoostsModalProps) {
  const { open, onOpenChange, ...contentProps } = props;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>Reward Boosts</DialogTitle>
            <DialogDescription>
              Hold {BOOST_CONFIG.TOKEN_THRESHOLD}+ $TALENT to get a 10% rewards
              boost.
            </DialogDescription>
          </DialogHeader>
          <Content {...contentProps} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Reward Boosts</DrawerTitle>
          <DrawerDescription>
            Hold {BOOST_CONFIG.TOKEN_THRESHOLD}+ $TALENT to get a 10% rewards
            boost.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-8">
          <Content {...contentProps} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

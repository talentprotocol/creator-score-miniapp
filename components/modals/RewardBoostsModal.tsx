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
import { Coins } from "lucide-react";
import { formatTokenAmount } from "@/lib/utils";
import { BOOST_CONFIG } from "@/lib/constants";

interface RewardBoostsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewardUsd: string; // base reward without boost, pre-formatted
  tokenBalance?: number | null;
  boostUsd: string; // boost amount, pre-formatted
  totalUsd: string; // total reward with boost applied, pre-formatted
  getTalentUrl?: string; // override link if needed
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
  getTalentUrl = "https://app.uniswap.org/swap?chain=base&inputCurrency=NATIVE&outputCurrency=0x9a33406165f562e16c3abd82fd1185482e01b49a",
}: Omit<RewardBoostsModalProps, "open" | "onOpenChange">) {
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
            <span className="text-purple-700">Total Reward</span>
            <span className="font-medium text-purple-700">{totalUsd}</span>
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

      <ButtonFullWidth
        variant="brand"
        icon={<Coins className="h-4 w-4" />}
        href={getTalentUrl}
      >
        Get $TALENT
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

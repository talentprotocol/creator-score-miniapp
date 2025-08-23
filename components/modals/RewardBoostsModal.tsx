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
import { formatTokenAmount, detectClient, openExternalUrl } from "@/lib/utils";
import { BOOST_CONFIG } from "@/lib/constants";

// TALENT token CAIP-19 asset ID on Base chain
const TALENT_TOKEN_CAIP19 =
  "eip155:8453/erc20:0x9a33406165f562e16c3abd82fd1185482e01b49a";

// Swap states for user feedback
type SwapState = 'idle' | 'loading' | 'success' | 'error' | 'rejected';

interface SwapResult {
  state: SwapState;
  message?: string;
  transactions?: string[];
}

/**
 * Handle token swap with Farcaster native swap or fallback to Aerodrome
 */
async function handleGetTalent(
  fallbackUrl: string,
  onStateChange: (result: SwapResult) => void
): Promise<void> {
  const client = await detectClient();

  // Try Farcaster native swap first
  if (client === "farcaster" || client === "base") {
    try {
      onStateChange({ state: 'loading' });
      
      const { sdk } = await import("@farcaster/miniapp-sdk");

      const result = await sdk.actions.swapToken({
        buyToken: TALENT_TOKEN_CAIP19,
        // sellToken and sellAmount are optional - user can choose what to sell
      });

      if (result.success) {
        onStateChange({
          state: 'success',
          message: `Swap completed successfully! ${result.swap.transactions.length} transaction(s) executed.`,
          transactions: result.swap.transactions
        });
      } else {
        const errorMessage = result.reason === 'rejected_by_user' 
          ? 'Swap was cancelled by user'
          : `Swap failed: ${result.error?.message || 'Unknown error'}`;
        
        onStateChange({
          state: result.reason === 'rejected_by_user' ? 'rejected' : 'error',
          message: errorMessage
        });
      }

      return; // Don't fall through to external URL
    } catch (error) {
      console.warn("Native swap failed, falling back to Aerodrome:", error);
      onStateChange({
        state: 'error',
        message: 'Native swap unavailable, redirecting to Aerodrome...'
      });
      
      // Small delay to show the message before redirect
      setTimeout(async () => {
        await openExternalUrl(fallbackUrl, null, client);
      }, 1500);
      return;
    }
  }

  // Fallback to external Aerodrome URL for non-Farcaster environments
  await openExternalUrl(fallbackUrl, null, client);
}

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
  getTalentUrl = "https://aerodrome.finance/swap?from=eth&to=0x9a33406165f562e16c3abd82fd1185482e01b49a&chain0=8453&chain1=8453",
}: Omit<RewardBoostsModalProps, "open" | "onOpenChange">) {
  const [swapResult, setSwapResult] = React.useState<SwapResult>({ state: 'idle' });
  
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
    await handleGetTalent(getTalentUrl, setSwapResult);
  };

  const resetSwapState = () => {
    setSwapResult({ state: 'idle' });
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
      {swapResult.state !== 'idle' && (
        <div className={`p-4 rounded-lg border ${
          swapResult.state === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : swapResult.state === 'loading'
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : swapResult.state === 'rejected'
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {swapResult.state === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
            {swapResult.state === 'success' && <CheckCircle className="h-4 w-4" />}
            {(swapResult.state === 'error' || swapResult.state === 'rejected') && <XCircle className="h-4 w-4" />}
            <span className="text-sm font-medium">
              {swapResult.state === 'loading' && 'Processing swap...'}
              {swapResult.state === 'success' && 'Swap Successful!'}
              {swapResult.state === 'error' && 'Swap Failed'}
              {swapResult.state === 'rejected' && 'Swap Cancelled'}
            </span>
          </div>
          {swapResult.message && (
            <p className="text-xs mt-1 opacity-80">{swapResult.message}</p>
          )}
          {swapResult.state !== 'loading' && (
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
        icon={swapResult.state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
        align="left"
        onClick={handleSwapClick}
        disabled={swapResult.state === 'loading'}
      >
        {swapResult.state === 'loading' ? 'Processing...' : 'Get $TALENT'}
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

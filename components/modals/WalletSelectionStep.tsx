"use client";

import * as React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Wallet {
  address: string;
  label: string;
  type: "farcaster-primary" | "farcaster-verified" | "talent-verified";
}

interface WalletSelectionStepProps {
  wallets: Wallet[];
  selectedWallet: string;
  onWalletSelect: (address: string) => void;
  onCopyAddress: (address: string) => void;
  copiedAddress?: string;
}

export function WalletSelectionStep({
  wallets,
  selectedWallet,
  onWalletSelect,
  onCopyAddress,
  copiedAddress,
}: WalletSelectionStepProps) {
  if (wallets.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-muted/50">
        <Typography size="sm" color="muted" className="text-center">
          No verified wallet addresses found. Please verify a wallet on Talent
          Protocol first.
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <RadioGroup
        value={selectedWallet}
        onValueChange={onWalletSelect}
        className="space-y-1"
      >
        {wallets.map((wallet) => {
          const isPrimary = wallet.type === "farcaster-primary";
          const isFarcaster = wallet.type.startsWith("farcaster");

          return (
            <div
              key={wallet.address}
              className={cn(
                "flex items-center space-x-2 py-2 px-1 cursor-pointer transition-colors rounded",
                selectedWallet === wallet.address
                  ? "bg-primary/5"
                  : "hover:bg-muted/50",
              )}
              onClick={() => onWalletSelect(wallet.address)}
            >
              <RadioGroupItem
                value={wallet.address}
                id={wallet.address}
                className="flex-shrink-0"
              />

              <div className="flex-1 cursor-pointer">
                {/* Wallet Address with Inline Chips */}
                <div className="flex items-center gap-2">
                  <Typography size="sm" className="font-mono">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </Typography>

                  {/* Source Chip */}
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      isFarcaster
                        ? "bg-brand-purple-light text-brand-purple"
                        : "bg-brand-green-light text-brand-green",
                    )}
                  >
                    {isFarcaster ? "Farcaster" : "Talent"}
                  </span>

                  {/* Primary Chip */}
                  {isPrimary && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      Primary
                    </span>
                  )}

                  {/* Copy Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyAddress(wallet.address);
                    }}
                  >
                    {copiedAddress === wallet.address ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}

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
    <div className="space-y-4">
      <RadioGroup
        value={selectedWallet}
        onValueChange={onWalletSelect}
        className="space-y-3"
      >
        {wallets.map((wallet) => (
          <div
            key={wallet.address}
            className={cn(
              "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
              selectedWallet === wallet.address
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30",
            )}
            onClick={() => onWalletSelect(wallet.address)}
          >
            <RadioGroupItem
              value={wallet.address}
              id={wallet.address}
              className="flex-shrink-0"
            />

            <div className="flex-1 cursor-pointer space-y-1">
              {/* Wallet Address */}
              <div className="flex items-center gap-2">
                <Typography size="sm" weight="medium" className="font-mono">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </Typography>

                {/* Copy Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted"
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

              {/* Wallet Label */}
              <Typography size="xs" color="muted">
                {wallet.label}
              </Typography>
            </div>
          </div>
        ))}
      </RadioGroup>

      {/* Selection Info */}
      {selectedWallet && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <Typography size="sm" color="muted">
            Selected: {selectedWallet.slice(0, 6)}...{selectedWallet.slice(-4)}
          </Typography>
        </div>
      )}
    </div>
  );
}

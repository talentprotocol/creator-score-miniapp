"use client";

import * as React from "react";
import { WalletMinimal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils";
import { AccountManagementModal } from "@/components/modals/AccountManagementModal";
import type {
  ConnectedAccount,
  AccountManagementAction,
} from "@/app/services/types";

interface ConnectedWalletsSectionProps {
  accounts: ConnectedAccount[];
  onAction: (
    action: AccountManagementAction,
  ) => Promise<{ success: boolean; message: string }>;
}

export function ConnectedWalletsSection({
  accounts,
  onAction,
}: ConnectedWalletsSectionProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_loadingAction, _setLoadingAction] = React.useState<string | null>(
    null,
  );
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleSetPrimary = async (identifier: string) => {
    _setLoadingAction(`primary-${identifier}`);
    try {
      await onAction({
        action: "set_primary",
        account_type: "wallet",
        identifier,
      });
    } finally {
      _setLoadingAction(null);
    }
  };

  // Find the primary wallet - the one with the oldest connected_at date
  const primaryWallet = React.useMemo(() => {
    if (accounts.length === 0) return null;

    return accounts.reduce((oldest, current) => {
      const oldestDate = new Date(oldest.connected_at);
      const currentDate = new Date(current.connected_at);
      return currentDate < oldestDate ? current : oldest;
    });
  }, [accounts]);

  if (accounts.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No wallet addresses found. Connect a wallet to get started.
        </p>

        {/* Add Wallet Button */}
        <Button
          onClick={() => setModalOpen(true)}
          variant="outline"
          className="w-full"
          size="sm"
          type="button"
        >
          Verify New Wallet
        </Button>

        <AccountManagementModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          accountType="wallet"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet List */}
      <div className="space-y-3">
        {accounts.map((account) => {
          const isPrimary = primaryWallet?.identifier === account.identifier;

          return (
            <div
              key={account.identifier}
              className="flex items-center justify-between p-4 bg-background border rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <WalletMinimal className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {truncateAddress(account.identifier)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verified on{" "}
                    {account.imported_from === "farcaster"
                      ? "Farcaster"
                      : account.imported_from === null
                        ? "Talent"
                        : account.imported_from}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Primary/Set Primary Button */}
                {isPrimary ? (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="whitespace-nowrap cursor-default min-w-[100px]"
                  >
                    Primary
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetPrimary(account.identifier)}
                    disabled={true}
                    className="whitespace-nowrap min-w-[100px]"
                  >
                    Set Primary
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Wallet Button */}
      <Button
        onClick={() => setModalOpen(true)}
        variant="outline"
        className="w-full"
        size="sm"
        type="button"
      >
        Verify New Wallet
      </Button>

      <AccountManagementModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        accountType="wallet"
      />
    </div>
  );
}

"use client";

import * as React from "react";
import { WalletMinimal, Loader2, LogOut } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { truncateAddress, openExternalUrl } from "@/lib/utils";
import { AccountManagementModal } from "@/components/modals/AccountManagementModal";
import type {
  ConnectedAccount,
  AccountManagementAction,
} from "@/app/services/types";
import { usePostHog } from "posthog-js/react";

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
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);
  const posthog = usePostHog();

  const handleSetPrimary = async (account: ConnectedAccount) => {
    // Track set primary click
    posthog?.capture("settings_wallet_primary_set", {
      wallet_address: account.identifier,
      wallet_source: account.imported_from || "talent",
      is_own_profile: true,
    });

    // For Farcaster-verified wallets, always open Farcaster settings
    if (account.imported_from === "farcaster") {
      await openExternalUrl(
        "https://farcaster.xyz/~/settings/verified-addresses",
      );
      return;
    }

    // For Talent-verified wallets, perform the API action (though button should be hidden)
    _setLoadingAction(`primary-${account.identifier}`);
    try {
      await onAction({
        action: "set_primary",
        account_type: "wallet",
        identifier: account.identifier,
      });
    } finally {
      _setLoadingAction(null);
    }
  };

  const handleConnectWallet = async () => {
    // Track connect wallet click
    posthog?.capture("settings_wallet_connect_clicked", {
      is_own_profile: true,
    });

    setIsConnecting(true);
    try {
      // Implement the logic to connect a wallet
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    setIsDisconnecting(true);
    try {
      // Implement the logic to disconnect a wallet
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No wallet addresses found. Connect a wallet to get started.
        </p>

        {/* Add Wallet Button */}
        <Button
          onClick={() => setModalOpen(true)}
          variant="special"
          className="w-full"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <WalletMinimal className="w-4 h-4 mr-2" />
              Connect Wallet
            </>
          )}
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
          const isPrimary = account.is_primary === true;
          const showSetPrimaryButton =
            !isPrimary && account.imported_from === "farcaster";
          const showPrimaryLabel = isPrimary;

          return (
            <div
              key={account.identifier}
              className="flex items-center justify-between p-4 bg-background border rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon icon={WalletMinimal} size="sm" color="muted" />
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
                {showPrimaryLabel ? (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="whitespace-nowrap cursor-default min-w-[100px]"
                  >
                    Primary
                  </Button>
                ) : showSetPrimaryButton ? (
                  <Button
                    onClick={() => handleSetPrimary(account)}
                    variant="default"
                    size="sm"
                    className="ml-auto"
                    disabled={account.is_primary}
                  >
                    {account.is_primary ? "Primary" : "Set Primary"}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Wallet Button */}
      <Button
        onClick={handleConnectWallet}
        variant="special"
        className="w-full"
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <WalletMinimal className="w-4 h-4 mr-2" />
            Connect Wallet
          </>
        )}
      </Button>

      {/* Disconnect button */}
      {accounts.length > 0 && (
        <Button
          onClick={handleDisconnectWallet}
          variant="default"
          className="w-full"
          disabled={isDisconnecting}
        >
          {isDisconnecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Disconnecting...
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect Wallet
            </>
          )}
        </Button>
      )}

      <AccountManagementModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        accountType="wallet"
      />
    </div>
  );
}

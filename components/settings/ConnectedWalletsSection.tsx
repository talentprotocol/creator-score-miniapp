"use client";

import * as React from "react";
import { WalletMinimal } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { truncateAddress, openExternalUrl } from "@/lib/utils";
import { AccountManagementModal } from "@/components/modals/AccountManagementModal";
import { WalletConnectInBrowserModal } from "@/components/modals/WalletConnectInBrowserModal";
import { useTalentAuthToken } from "@/hooks/useTalentAuthToken";
import { isFarcasterMiniApp } from "@/lib/client/miniapp";
import type { ConnectedAccount, AccountManagementAction } from "@/lib/types";
//

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
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<
    { type: "error" | "success"; message: string } | null
  >(null);
  const { token: tpToken, expiresAt } = useTalentAuthToken();
  const [isMiniApp, setIsMiniApp] = React.useState(false);
  const [showBrowserModal, setShowBrowserModal] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const val = await isFarcasterMiniApp(150);
      if (mounted) setIsMiniApp(val);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSetPrimary = async (account: ConnectedAccount) => {
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
    if (busy) return;
    setNotice(null);
    // In Farcaster Mini App, prevent SDK-based connect and show modal to open browser
    if (isMiniApp) {
      setShowBrowserModal(true);
      return;
    }
    setBusy(true);
    try {
      const result = await onAction({ action: "connect", account_type: "wallet" });
      if (!result || !result.success) {
        const msg = (result && typeof result.message === "string" && result.message.trim())
          ? result.message
          : "Couldn't connect wallet. Please try again.";
        console.error("Connect wallet failed:", msg, result ?? {});
        setNotice({ type: "error", message: msg });
      } else {
        setNotice({ type: "success", message: "Wallet connected" });
      }
    } catch (e) {
      console.error("Connect wallet error:", e);
      setNotice({ type: "error", message: "Couldn't connect wallet. Please try again." });
    } finally {
      setBusy(false);
      setTimeout(() => {
        setNotice((cur) => (cur?.type === "success" ? null : cur));
      }, 5000);
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
          onClick={handleConnectWallet}
          className="w-full"
          variant="brand-purple"
          disabled={busy}
        >
          <WalletMinimal className="w-4 h-4 mr-2" />
          {busy ? "Connecting..." : "Connect New Wallet"}
        </Button>

        {notice?.type === "error" && (
          <p className="text-sm text-red-600">
            {notice.message}
          </p>
        )}
        {notice?.type === "success" && (
          <p className="text-sm text-green-600">
            {notice.message}
          </p>
        )}

        <AccountManagementModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          accountType="wallet"
        />
        <WalletConnectInBrowserModal
          open={showBrowserModal}
          onOpenChange={setShowBrowserModal}
          authToken={tpToken}
          expiresAt={expiresAt}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Wallet Button */}
      <Button
        onClick={handleConnectWallet}
        className="w-full"
        variant="brand-purple"
        disabled={busy}
      >
        <WalletMinimal className="w-4 h-4 mr-2" />
        {busy ? "Connecting..." : "Connect New Wallet"}
      </Button>

      {notice?.type === "error" && (
        <p className="text-sm text-red-600">
          {notice.message}
        </p>
      )}
      {notice?.type === "success" && (
        <p className="text-sm text-green-600">
          {notice.message}
        </p>
      )}

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
                    disabled={true}
                    className="whitespace-nowrap cursor-default min-w-[100px]"
                  >
                    Primary
                  </Button>
                ) : showSetPrimaryButton ? (
                  <Button
                    onClick={() => handleSetPrimary(account)}
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

      {/* Keep modal available if needed for future external management; currently unused */}
      <AccountManagementModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        accountType="wallet"
      />
      <WalletConnectInBrowserModal
        open={showBrowserModal}
        onOpenChange={setShowBrowserModal}
        authToken={tpToken}
        expiresAt={expiresAt}
      />
    </div>
  );
}

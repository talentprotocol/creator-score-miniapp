"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useUserResolution } from "@/hooks/useUserResolution";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Callout } from "@/components/common/Callout";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { ConnectedSocialsSection } from "@/components/settings/ConnectedSocialsSection";
import { ConnectedWalletsSection } from "@/components/settings/ConnectedWalletsSection";
import { AccountSettingsSection } from "@/components/settings/AccountSettingsSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { ProofOfHumanitySection } from "@/components/settings/ProofOfHumanitySection";
import { Button } from "@/components/ui/button";
import { getVersionDisplay } from "@/lib/version";
import {
  ExternalLink,
  FileText,
  MessageCircle,
  LogOut,
  Users,
  Wallet,
  Bell,
  Settings,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { openExternalUrl } from "@/lib/utils";

export default function SettingsPage() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const router = useRouter();
  const { talentUuid } = useUserResolution();

  const {
    accounts,
    settings,
    humanityCredentials,
    loading,
    error,
    performAction,
    updateNotifications,
  } = useConnectedAccounts(talentUuid || undefined);

  // Check if any humanity credentials are verified (must be before early returns)
  const hasVerifiedHumanityCredentials = React.useMemo(() => {
    return (
      humanityCredentials?.some((credential) => credential.points > 0) || false
    );
  }, [humanityCredentials]);

  useEffect(() => {
    if (!user) {
      // If no user context, redirect to leaderboard
      router.push("/leaderboard");
      return;
    }
  }, [user, router]);

  if (!user) {
    return null; // Will redirect
  }

  if (loading || !accounts || !settings || humanityCredentials === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Callout>
          <strong>Error loading settings:</strong> {error}
        </Callout>
      </div>
    );
  }

  // Access grouped accounts
  const socialAccounts = accounts?.social || [];
  const walletAccounts = accounts?.wallet || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Accordion
        type="single"
        collapsible
        className="w-full space-y-2"
        defaultValue="connected-socials"
      >
        {/* Connected Socials */}
        <AccordionItem
          value="connected-socials"
          className="bg-muted rounded-xl border-0 shadow-none"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Connected Socials</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <ConnectedSocialsSection
              accounts={socialAccounts || []}
              onAction={performAction}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Connected Wallets */}
        <AccordionItem
          value="connected-wallets"
          className="bg-muted rounded-xl border-0 shadow-none"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Connected Wallets</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <ConnectedWalletsSection
              accounts={walletAccounts || []}
              onAction={performAction}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Proof of Humanity */}
        <AccordionItem
          value="proof-of-humanity"
          className="bg-muted rounded-xl border-0 shadow-none"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              {hasVerifiedHumanityCredentials ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">Proof of Humanity</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <ProofOfHumanitySection credentials={humanityCredentials} />
          </AccordionContent>
        </AccordionItem>

        {/* Notifications */}
        <AccordionItem
          value="notifications"
          className="bg-muted rounded-xl border-0 shadow-none"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Notifications</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <NotificationsSection
              settings={settings}
              onUpdateNotifications={updateNotifications}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Account Settings */}
        <AccordionItem
          value="account-settings"
          className="bg-muted rounded-xl border-0 shadow-none"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Account Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            <AccountSettingsSection
              settings={settings}
              onAction={performAction}
            />
          </AccordionContent>
        </AccordionItem>

        {/* About */}
        <div className="bg-muted rounded-xl border-0 shadow-none">
          <Button
            type="button"
            variant="ghost"
            className="w-full flex items-center justify-between px-6 py-4 h-auto rounded-xl hover:bg-muted/80"
            onClick={() =>
              openExternalUrl(
                "https://docs.talentprotocol.com/docs/protocol-concepts/scoring-systems/creator-score",
              )
            }
          >
            <div className="flex items-center gap-3">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">About</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Dev Docs */}
        <div className="bg-muted rounded-xl border-0 shadow-none">
          <Button
            type="button"
            variant="ghost"
            className="w-full flex items-center justify-between px-6 py-4 h-auto rounded-xl hover:bg-muted/80"
            onClick={() => openExternalUrl("https://docs.talentprotocol.com/")}
          >
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Dev Docs</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Support */}
        <div className="bg-muted rounded-xl border-0 shadow-none">
          <Button
            type="button"
            variant="ghost"
            className="w-full flex items-center justify-between px-6 py-4 h-auto rounded-xl hover:bg-muted/80"
            onClick={() =>
              openExternalUrl("https://discord.com/invite/talentprotocol")
            }
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Support</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Log Out - with extra spacing above */}
        <div className="bg-muted rounded-xl border-0 shadow-none mt-6">
          <Button
            type="button"
            variant="ghost"
            disabled
            className="w-full flex items-center justify-between px-6 py-4 h-auto rounded-xl opacity-50 cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Log Out</span>
            </div>
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </Button>
        </div>
      </Accordion>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-muted text-center space-y-1">
        <p className="text-xs text-muted-foreground">{getVersionDisplay()}</p>
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <button
            onClick={() => openExternalUrl("https://www.talentprotocol.com/")}
            className="underline hover:no-underline"
          >
            Talent Protocol
          </button>
        </p>
        <p className="text-xs text-muted-foreground">
          <button
            onClick={() =>
              openExternalUrl(
                "https://docs.talentprotocol.com/docs/legal/builder-rewards-terms-conditions",
              )
            }
            className="underline hover:no-underline"
          >
            Terms and Conditions
          </button>
        </p>
      </div>
    </div>
  );
}

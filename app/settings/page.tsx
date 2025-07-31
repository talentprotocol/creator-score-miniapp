"use client";

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
import { ProofOfHumanitySection } from "@/components/settings/ProofOfHumanitySection";
import { ButtonFullWidth } from "@/components/ui/button-full-width";
import { getVersionDisplay } from "@/lib/version";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";
import {
  FileText,
  MessageCircle,
  LogOut,
  Users,
  Wallet,
  Settings,
  Info,
  CheckCircle,
  XCircle,
  Share,
} from "lucide-react";
import { openExternalUrl } from "@/lib/utils";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { useShareCreatorScore } from "@/hooks/useShareCreatorScore";
import { ShareCreatorScoreModal } from "@/components/modals/ShareCreatorScoreModal";
import { usePostHog } from "posthog-js/react";

export default function SettingsPage() {
  const router = useRouter();
  const { handleLogout, authenticated } = usePrivyAuth({});
  const { talentUuid, loading: loadingUserResolution } = useUserResolution();
  const posthog = usePostHog();
  const { isOpen, onOpenChange, openForTesting } = useShareCreatorScore();

  const {
    accounts,
    settings,
    humanityCredentials,
    loading,
    error,
    performAction,
  } = useConnectedAccounts(talentUuid || undefined);

  // Check if any humanity credentials are verified (must be before early returns)
  const hasVerifiedHumanityCredentials = React.useMemo(() => {
    return (
      humanityCredentials?.some((credential) => credential.points > 0) || false
    );
  }, [humanityCredentials]);

  useEffect(() => {
    if (!loadingUserResolution) {
      return;
    }

    if (!talentUuid) {
      // If no user context, redirect to leaderboard
      router.push("/leaderboard");
      return;
    }
  }, [loadingUserResolution, talentUuid, router]);

  if (!talentUuid) {
    return null; // Will redirect
  }

  if (loading || !accounts || !settings || humanityCredentials === null) {
    return (
      <PageContainer noPadding>
        <Section variant="content">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </Section>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer noPadding>
        <Section variant="content">
          <Callout>
            <strong>Error loading settings:</strong> {error}
          </Callout>
        </Section>
      </PageContainer>
    );
  }

  // Access grouped accounts
  const socialAccounts = accounts?.social || [];
  const walletAccounts = accounts?.wallet || [];

  // Handle section expansion tracking
  const handleSectionExpand = (sectionName: string) => {
    posthog?.capture("settings_section_expanded", {
      section_name: sectionName,
      is_own_profile: true, // Settings page is always own profile
    });
  };

  // Handle external link clicks
  const handleExternalLinkClick = (linkType: string) => {
    posthog?.capture("settings_external_link_clicked", {
      link_type: linkType,
      is_own_profile: true,
    });
  };

  // Handle logout click
  const handleLogoutClick = () => {
    posthog?.capture("settings_external_link_clicked", {
      link_type: "logout",
      is_own_profile: true,
    });
    handleLogout();
  };

  return (
    <PageContainer noPadding>
      {/* Header section */}
      <Section variant="header">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account</p>
      </Section>

      {/* Content section */}
      <Section variant="content">
        <Accordion type="single" collapsible className="w-full space-y-2">
          {/* Connected Socials */}
          <AccordionItem
            value="connected-socials"
            className="bg-muted rounded-xl border-0 shadow-none"
          >
            <AccordionTrigger
              className="px-6 py-4 hover:no-underline"
              onClick={() => handleSectionExpand("connected_socials")}
            >
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
            <AccordionTrigger
              className="px-6 py-4 hover:no-underline"
              onClick={() => handleSectionExpand("connected_wallets")}
            >
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
            <AccordionTrigger
              className="px-6 py-4 hover:no-underline"
              onClick={() => handleSectionExpand("proof_of_humanity")}
            >
              <div className="flex items-center gap-3">
                {hasVerifiedHumanityCredentials ? (
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
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

          {/* Account Settings */}
          <AccordionItem
            value="account-settings"
            className="bg-muted rounded-xl border-0 shadow-none"
          >
            <AccordionTrigger
              className="px-6 py-4 hover:no-underline"
              onClick={() => handleSectionExpand("account_settings")}
            >
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
          <Callout
            variant="neutral"
            icon={<Info />}
            href="https://talentprotocol.com/about"
            external
            onClick={() => handleExternalLinkClick("about")}
          >
            About
          </Callout>

          {/* Dev Docs */}
          <Callout
            variant="neutral"
            icon={<FileText />}
            href="https://docs.talentprotocol.com/"
            external
            onClick={() => handleExternalLinkClick("dev_docs")}
          >
            Dev Docs
          </Callout>

          {/* Support */}
          <Callout
            variant="neutral"
            icon={<MessageCircle />}
            href="https://talentprotocol.com/support"
            external
            onClick={() => handleExternalLinkClick("support")}
          >
            Support
          </Callout>

          {/* Log Out - with extra spacing above */}
          {authenticated && (
            <div className="bg-muted rounded-xl border-0 shadow-none mt-6">
              <ButtonFullWidth
                styling="default"
                icon={<LogOut className="h-4 w-4" />}
                onClick={handleLogoutClick}
              >
                <span className="font-medium">Log Out</span>
              </ButtonFullWidth>
            </div>
          )}
        </Accordion>

        {/* Test Share Score Modal - Development Only */}
        {process.env.NEXT_PUBLIC_DEV_MODE === "true" && (
          <div className="mt-6">
            <ButtonFullWidth
              styling="destructive"
              icon={<Share className="h-4 w-4" />}
              onClick={openForTesting}
            >
              Test Share Score Modal
            </ButtonFullWidth>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-muted text-center space-y-1">
          <p className="text-xs text-muted-foreground">{getVersionDisplay()}</p>
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <button
              onClick={() => {
                handleExternalLinkClick("talent_protocol");
                openExternalUrl("https://www.talentprotocol.com/");
              }}
              className="underline hover:no-underline"
            >
              Talent Protocol
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            <button
              onClick={() => {
                handleExternalLinkClick("terms");
                openExternalUrl(
                  "https://docs.talentprotocol.com/docs/legal/creator-rewards-terms-conditions",
                );
              }}
              className="underline hover:no-underline"
            >
              Terms and Conditions
            </button>
          </p>
        </div>
      </Section>

      {/* Share Score Modal */}
      <ShareCreatorScoreModal open={isOpen} onOpenChange={onOpenChange} />
    </PageContainer>
  );
}

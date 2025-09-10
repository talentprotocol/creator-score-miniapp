"use client";

import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import React, { useEffect, Suspense } from "react";
import { SectionAccordion } from "@/components/common/SectionAccordion";
import { Callout } from "@/components/common/Callout";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { ConnectedSocialsSection } from "@/components/settings/ConnectedSocialsSection";
import { ConnectedWalletsSection } from "@/components/settings/ConnectedWalletsSection";
import { PayItForwardSection } from "@/components/settings/PayItForwardSection";
import { AccountSettingsSection } from "@/components/settings/AccountSettingsSection";
import { ConnectedEmailsSection } from "@/components/settings/ConnectedEmailsSection";
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
  CheckCircle,
  XCircle,
  HandHeart,
  Coins,
  Loader2,
  Mail,
} from "lucide-react";
import { ProfileSettingsSection } from "@/components/settings/ProfileSettingsSection";
import { openExternalUrl, isFarcasterMiniAppSync } from "@/lib/utils";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { useTalentAuthToken } from "@/hooks/useTalentAuthToken";
import { usePostHog } from "posthog-js/react";
import { useSearchParams } from "next/navigation";
import {
  handleGetTalent,
  DEFAULT_TALENT_SWAP_URL,
  SwapResult,
} from "@/lib/talent-swap";
import { FarcasterAccessModal } from "@/components/modals/FarcasterAccessModal";

// Separate component that uses search params
function SettingsContent() {
  const { handleLogout, authenticated } = usePrivyAuth({});
  const { talentUuid, loading: loadingUserResolution } = useFidToTalentUuid();
  const posthog = usePostHog();
  const searchParams = useSearchParams();
  const { token: tpToken, loading: tpLoading, stage: tpStage, ensureTalentAuthToken } = useTalentAuthToken();
  const isMiniApp = isFarcasterMiniAppSync();

  // Talent swap state
  const [swapResult, setSwapResult] = React.useState<SwapResult>({
    state: "idle",
  });

  // Modal state for unauthenticated users
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  // Check if we should auto-expand a specific section
  const autoExpandSection = searchParams?.get("section");

  // Track open accordion sections (must be declared before any early returns)
  const [openSections, setOpenSections] = React.useState<string[]>(
    autoExpandSection ? [autoExpandSection] : [],
  );

  const {
    accounts,
    settings,
    humanityCredentials,
    loading,
    error,
    performAction,
    refetch,
  } = useConnectedAccounts(talentUuid || undefined);

  // Check if any humanity credentials are verified (must be before early returns)
  const hasVerifiedHumanityCredentials = React.useMemo(() => {
    return (
      humanityCredentials?.some((credential) => credential.points > 0) || false
    );
  }, [humanityCredentials]);

  // Show FarcasterAccessModal for unauthenticated users (following Badges page pattern)
  useEffect(() => {
    if (!loadingUserResolution && !talentUuid) {
      setShowAuthModal(true);
    }
  }, [loadingUserResolution, talentUuid]);

  // Ensure token on mount for authenticated users OR when inside Farcaster mini app
  useEffect(() => {
    if (!authenticated && !isMiniApp) return;
    void ensureTalentAuthToken();
  }, [authenticated, isMiniApp, ensureTalentAuthToken]);

  // After token is available, refetch settings to get email (requires auth)
  const lastRefreshedTokenRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!authenticated) return;
    if (!tpToken) return;
    if (lastRefreshedTokenRef.current === tpToken) return;
    lastRefreshedTokenRef.current = tpToken;
    void refetch();
  }, [authenticated, tpToken, refetch]);

  // Block settings until we have a Talent Protocol auth token
  if ((authenticated || isMiniApp) && (tpLoading || !tpToken)) {
    return (
      <PageContainer>
        <Section variant="content">
          <div className="space-y-3">
            <h1 className="text-lg font-semibold">Wallet signature required</h1>
            <p className="text-sm text-muted-foreground">
              {tpStage === "nonce" && "Preparing secure sign-in..."}
              {tpStage === "sign" && "Waiting for wallet signature..."}
              {tpStage === "exchange" && "Signing complete. Finalizing authentication..."}
              {tpStage === "rejected" && "You cancelled the request. To manage your settings, please sign the message with your wallet."}
              {(tpStage === "idle" || !tpStage) &&
                "Waiting for wallet signature before accessing your settings."}
            </p>
            <div className="mt-2">
              <div className="flex gap-2">
                <ButtonFullWidth
                  variant="muted"
                  icon={<Loader2 className="h-4 w-4" />}
                  align="left"
                  onClick={() => void ensureTalentAuthToken({ force: true })}
                  showRightIcon={false}
                  disabled={tpLoading}
                >
                  <span className="font-medium">
                    {tpLoading
                      ? tpStage === "exchange"
                        ? "Finalizing..."
                        : "Awaiting Signature..."
                      : "Sign Again"}
                  </span>
                </ButtonFullWidth>
              </div>
            </div>
          </div>
        </Section>
      </PageContainer>
    );
  }

  // Show loading while resolving user
  if (loadingUserResolution) {
    return (
      <PageContainer>
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

  // Show FarcasterAccessModal for unauthenticated users
  if (!talentUuid) {
    return (
      <>
        <PageContainer>
          <Section variant="content">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-muted animate-pulse rounded-xl"
                />
              ))}
            </div>
          </Section>
        </PageContainer>
        <FarcasterAccessModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          redirectPath="/settings"
        />
      </>
    );
  }

  if (loading || !accounts || !settings || humanityCredentials === null) {
    return (
      <PageContainer>
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
      <PageContainer>
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

  // Handle talent swap click
  const handleTalentSwapClick = async () => {
    // Track analytics
    posthog?.capture("get_talent_button_clicked", {
      location: "settings_page",
    });

    await handleGetTalent(DEFAULT_TALENT_SWAP_URL, setSwapResult);
  };

  // Get button text based on swap state
  const getTalentButtonText = () => {
    switch (swapResult.state) {
      case "loading":
        return "Processing...";
      case "success":
        return "Swap Successful!";
      case "error":
        return "Swap Failed";
      case "rejected":
        return "Swap Cancelled";
      default:
        return "Get $TALENT";
    }
  };

  // Get button icon based on swap state
  const getTalentButtonIcon = () => {
    switch (swapResult.state) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  return (
    <PageContainer>
      {/* Header section */}
      <Section variant="header">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account</p>
      </Section>

      {/* Content section */}
      <Section variant="content">
        {/** Track which sections are open to enable lazy-loading behavior */}
        <SectionAccordion
          type="multiple"
          variant="gray"
          defaultExpanded={autoExpandSection ? [autoExpandSection] : []}
          onExpandedChange={(openIds) => {
            setOpenSections(openIds);
          }}
          sections={[
            {
              id: "connected-socials",
              title: "Connected Socials",
              icon: <Users className="h-4 w-4" />,
              content: (
                <ConnectedSocialsSection
                  accounts={socialAccounts || []}
                  onAction={performAction}
                />
              ),
            },
            {
              id: "connected-wallets",
              title: "Connected Wallets",
              icon: <Wallet className="h-4 w-4" />,
              content: (
                <ConnectedWalletsSection
                  accounts={walletAccounts || []}
                  onAction={performAction}
                />
              ),
            },
            {
              id: "profile",
              title: "Profile",
              icon: <Settings className="h-4 w-4" />,
              content: (
                <ProfileSettingsSection
                  talentUuid={talentUuid}
                  initialProfile={undefined}
                />
              ),
            },
            {
              id: "connected-emails",
              title: "Connected Emails",
              icon: <Mail className="h-4 w-4" />,
              content: (
                <ConnectedEmailsSection
                  expanded={openSections?.includes("connected-emails") || false}
                />
              ),
            },
            {
              id: "pay-it-forward",
              title: "Pay It Forward",
              icon: <HandHeart className="h-4 w-4" />,
              content: <PayItForwardSection />,
            },
            {
              id: "proof-of-humanity",
              title: "Proof of Humanity",
              icon: hasVerifiedHumanityCredentials ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              ),
              content: (
                <ProofOfHumanitySection credentials={humanityCredentials} />
              ),
            },
            {
              id: "account-settings",
              title: "Account Settings",
              icon: <Settings className="h-4 w-4" />,
              content: (
                <AccountSettingsSection />
              ),
            },
          ]}
        />

        {/* Get $TALENT */}
        <div className="mt-2">
          <ButtonFullWidth
            variant="muted"
            icon={getTalentButtonIcon()}
            align="left"
            onClick={handleTalentSwapClick}
            disabled={swapResult.state === "loading"}
            showRightIcon={true}
          >
            <span className="font-medium">{getTalentButtonText()}</span>
          </ButtonFullWidth>
        </div>

        {/* Dev Docs */}
        <div className="mt-2">
          <ButtonFullWidth
            variant="muted"
            icon={<FileText className="h-4 w-4" />}
            align="left"
            href="https://docs.talentprotocol.com/"
            external
            onClick={() => handleExternalLinkClick("dev_docs")}
          >
            <span className="font-medium">Dev Docs</span>
          </ButtonFullWidth>
        </div>

        {/* Support */}
        <div className="mt-2">
          <ButtonFullWidth
            variant="muted"
            icon={<MessageCircle className="h-4 w-4" />}
            align="left"
            href="https://discord.com/invite/talentprotocol"
            external
            onClick={() => handleExternalLinkClick("support")}
          >
            <span className="font-medium">Support</span>
          </ButtonFullWidth>
        </div>

        {/* Log Out - with extra spacing above */}
        {authenticated && (
          <div className="bg-muted rounded-xl border-0 shadow-none mt-2">
            <ButtonFullWidth
              variant="muted"
              icon={<LogOut className="h-4 w-4" />}
              align="left"
              onClick={handleLogoutClick}
              showRightIcon={false}
            >
              <span className="font-medium">Log Out</span>
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
    </PageContainer>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

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
  User,
} from "lucide-react";
import { ProfileSettingsSection } from "@/components/settings/ProfileSettingsSection";
import { openExternalUrl } from "@/lib/utils";
import { isFarcasterMiniApp } from "@/lib/client/miniapp";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { useTalentAuthToken } from "@/hooks/useTalentAuthToken";
import { usePostHog } from "posthog-js/react";
import { useSearchParams, useRouter } from "next/navigation";
import { CACHE_KEYS } from "@/lib/cache-keys";
import {
  handleGetTalent,
  DEFAULT_TALENT_SWAP_URL,
  SwapResult,
} from "@/lib/talent-swap";
import { FarcasterAccessModal } from "@/components/modals/FarcasterAccessModal";

// Separate component that uses search params
function SettingsContent() {
  const router = useRouter();
  const { handleLogout, authenticated } = usePrivyAuth({});
  const { talentUuid, loading: loadingUserResolution } = useFidToTalentUuid();
  const posthog = usePostHog();
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const { token: tpToken, loading: tpLoading, stage: tpStage, error: tpError, ensureTalentAuthToken } = useTalentAuthToken();
  const [isMiniApp, setIsMiniApp] = React.useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const val = await isFarcasterMiniApp(150);
      if (mounted) setIsMiniApp(val);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Talent swap state
  const [swapResult, setSwapResult] = React.useState<SwapResult>({
    state: "idle",
  });

  // Modal state for unauthenticated users
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  // Check if we should auto-expand a specific section
  const autoExpandSection = searchParams?.get("section");

  // Read success message from URL (e.g., success_message=Email%20verified)
  React.useEffect(() => {
    const anyParams = !!searchParams?.toString();
    const msg = searchParams?.get("success_message");
    if (msg) setSuccessMessage(msg);
    // Strip ALL query params on load for a clean URL
    if (anyParams) {
      try {
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          router.replace(url.pathname);
        }
      } catch {}
    }
  }, [searchParams, router]);

  // If redirected after successful connection, bypass client caches and refetch fresh data
  // (placed after hooks that define refetch)

  const dismissSuccessMessage = React.useCallback(() => {
    setSuccessMessage(null);
    try {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      router.replace(url.pathname);
    } catch {}
  }, [router]);

  // Auto-dismiss success message after 5 seconds
  React.useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => {
      dismissSuccessMessage();
    }, 5000);
    return () => clearTimeout(t);
  }, [successMessage, dismissSuccessMessage]);

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

  // If redirected after successful connection, bypass client caches and refetch fresh data
  React.useEffect(() => {
    if (!successMessage || !talentUuid) return;
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("tpAuthJustIssued", "1");
        const keys = [
          `${CACHE_KEYS.CONNECTED_ACCOUNTS}_${talentUuid}`,
          `${CACHE_KEYS.USER_SETTINGS}_${talentUuid}`,
          `${CACHE_KEYS.HUMANITY_CREDENTIALS}_${talentUuid}`,
          `${CACHE_KEYS.PROFILE_SOCIAL_ACCOUNTS}_${talentUuid}`,
          `${CACHE_KEYS.PROFILE_WALLET_ACCOUNTS}_${talentUuid}`,
        ];
        keys.forEach((k) => {
          localStorage.removeItem(k);
          localStorage.removeItem(`cache:${k}`);
        });
      }
    } catch {}
    void refetch();
  }, [successMessage, talentUuid, refetch]);

  // Block settings until we have a Talent Protocol auth token
  if ((authenticated || isMiniApp) && (tpLoading || !tpToken)) {
    return (
      <PageContainer>
        <Section variant="content">
          {successMessage && (
            <div className="mb-3">
              <Callout variant="brand-green" title={successMessage} onClose={dismissSuccessMessage} />
            </div>
          )}
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
            {tpError && (
              <p className="text-xs text-red-500 mt-1">{tpError}</p>
            )}
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
              {authenticated && (
                <div className="flex gap-2 mt-2">
                  <ButtonFullWidth
                    variant="muted"
                    icon={<LogOut className="h-4 w-4" />}
                    align="left"
                    onClick={handleLogout}
                    showRightIcon={false}
                  >
                    <span className="font-medium">Log Out</span>
                  </ButtonFullWidth>
                </div>
              )}
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
          {successMessage && (
            <div className="mb-3">
              <Callout variant="brand-green" title={successMessage} onClose={dismissSuccessMessage} />
            </div>
          )}
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
            {successMessage && (
              <div className="mb-3">
                <Callout variant="brand-green" title={successMessage} onClose={dismissSuccessMessage} />
              </div>
            )}
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
          {successMessage && (
            <div className="mb-3">
              <Callout variant="brand-green" title={successMessage} onClose={dismissSuccessMessage} />
            </div>
          )}
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
          {successMessage && (
            <div className="mb-3">
              <Callout variant="brand-green" title={successMessage} onClose={dismissSuccessMessage} />
            </div>
          )}
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
        {successMessage && (
          <div className="mb-3">
            <Callout variant="brand-green" title={successMessage} onClose={dismissSuccessMessage} />
          </div>
        )}
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
              icon: <User className="h-4 w-4" />,
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

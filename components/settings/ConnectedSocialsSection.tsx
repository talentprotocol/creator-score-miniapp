"use client";

import * as React from "react";
import {
  Github,
  Twitter,
  Instagram,
  Youtube,
  Video,
  FileText,
  Heart,
  Linkedin,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { AccountManagementModal } from "@/components/modals/AccountManagementModal";
import type { ConnectedAccount, AccountManagementAction } from "@/lib/types";
import { usePostHog } from "posthog-js/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTalentAuthToken } from "@/hooks/useTalentAuthToken";
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

interface ConnectedSocialsSectionProps {
  accounts: ConnectedAccount[];
  onAction: (
    action: AccountManagementAction,
  ) => Promise<{ success: boolean; message: string }>;
}

const socialPlatforms = [
  {
    name: "X (Twitter)",
    source: "x_twitter",
    icon: Twitter,
    color: "text-foreground",
    comingSoon: false,
  },
  {
    name: "GitHub",
    source: "github",
    icon: Github,
    color: "text-foreground",
    comingSoon: false,
  },
  {
    name: "LinkedIn",
    source: "linkedin",
    icon: Linkedin,
    color: "text-foreground",
    comingSoon: false,
  },
  {
    name: "Instagram",
    source: "instagram",
    icon: Instagram,
    color: "text-foreground",
    comingSoon: true,
  },
  {
    name: "YouTube",
    source: "youtube",
    icon: Youtube,
    color: "text-foreground",
    comingSoon: true,
  },
  {
    name: "TikTok",
    source: "tiktok",
    icon: Video,
    color: "text-foreground",
    comingSoon: true,
  },
  {
    name: "Substack",
    source: "substack",
    icon: FileText,
    color: "text-foreground",
    comingSoon: true,
  },
  {
    name: "Patreon",
    source: "patreon",
    icon: Heart,
    color: "text-foreground",
    comingSoon: true,
  }
];

export function ConnectedSocialsSection({
  accounts,
  onAction,
}: ConnectedSocialsSectionProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const posthog = usePostHog();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [selected, setSelected] = React.useState<{
    name: string;
    source: string;
  } | null>(null);

  const { token: tpToken, ensureTalentAuthToken } = useTalentAuthToken();

  const handleConnect = async (platform: string) => {
    // Track connect click
    posthog?.capture("settings_account_connect_clicked", {
      account_type: "social",
      platform,
      is_own_profile: true,
    });
    // Redirect-based connect flow for supported platforms
    const supported = new Set(["x_twitter", "github", "linkedin"]);
    if (supported.has(platform)) {
      try {
        let t = tpToken;
        if (!t) t = (await ensureTalentAuthToken()) || null;
        if (!t) {
          // Fallback UX if token is missing
          // eslint-disable-next-line no-alert
          alert("Wallet signature required to connect account");
          return;
        }
        const mapped = platform === "x_twitter" ? "twitter" : platform;
        const loginBase = "https://login.talentprotocol.com";
        // Build redirect URL to current settings page with success message
        let redirectUrl = "/settings";
        try {
          if (typeof window !== "undefined") {
            const current = new URL(window.location.href);
            current.pathname = "/settings";
            const human = (socialPlatforms.find((p) => p.source === platform)?.name || mapped).replace("X (Twitter)", "Twitter");
            const msg = `${human} account connected successfully!`;
            current.searchParams.set("success_message", msg);
            redirectUrl = current.toString();
          }
        } catch {}
        const url = `${loginBase}/${mapped}/connect?auth_token=${encodeURIComponent(t)}&redirect_url=${encodeURIComponent(redirectUrl)}`;
        window.location.href = url;
        return;
      } catch {}
    }
    // Default modal flow for unsupported/coming soon platforms
    setModalOpen(true);
  };

  const handleDisconnect = async (platform: string) => {
    // Track disconnect click
    posthog?.capture("settings_account_disconnect_clicked", {
      account_type: "social",
      platform,
      is_own_profile: true,
    });
    const item = socialPlatforms.find((p) => p.source === platform);
    setSelected({ name: item?.name || platform, source: platform });
    setConfirmOpen(true);
  };

  const getConnectedAccount = (source: string) => {
    return accounts.find((account) => account.source === source);
  };

  return (
    <div className="space-y-3">
      {socialPlatforms.map((platform) => {
        const connectedAccount = getConnectedAccount(platform.source);

        return (
          <div
            key={platform.source}
            className="flex items-center justify-between p-4 bg-background border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Icon icon={platform.icon} size="md" color="muted" />
              <div>
                <div className="font-medium text-sm">{platform.name}</div>
                {connectedAccount && (
                  <div className="text-xs text-muted-foreground">
                    @
                    {connectedAccount.username ||
                      connectedAccount.handle ||
                      "Unknown"}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={() =>
                connectedAccount
                  ? handleDisconnect(platform.source)
                  : handleConnect(platform.source)
              }
              className="ml-auto"
              variant={
                platform.comingSoon
                  ? "default"
                  : connectedAccount
                    ? "default"
                    : "brand-purple"
              }
              disabled={platform.comingSoon}
            >
              {platform.comingSoon
                ? "Coming Soon"
                : connectedAccount
                  ? "Disconnect"
                  : "Connect"}
            </Button>
          </div>
        );
      })}

      <AccountManagementModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        accountType="social"
      />

      {/* Confirm Disconnect Modal */}
      {isDesktop ? (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Disconnect {selected?.name}?</DialogTitle>
              <DialogDescription>
                Disconnecting may reduce your Creator Score and remove related
                benefits. Are you sure you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Button
                variant="destructive"
                className="w-full"
                disabled={busy}
                onClick={async () => {
                  if (!selected) return;
                  setBusy(true);
                  try {
                    const mapped =
                      selected.source === "x_twitter"
                        ? "twitter"
                        : selected.source;
                    posthog?.capture("settings_account_disconnect_confirmed", {
                      account_type: "social",
                      platform: mapped,
                      is_own_profile: true,
                    });
                    await onAction({
                      action: "disconnect",
                      account_type: mapped as AccountManagementAction["account_type"],
                    });
                    setConfirmOpen(false);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Disconnecting..." : "Disconnect"}
              </Button>
              <Button
                variant="default"
                className="w-full"
                onClick={() => {
                  posthog?.capture("settings_account_disconnect_cancelled", {
                    account_type: "social",
                    platform: selected?.source,
                    is_own_profile: true,
                  });
                  setConfirmOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={confirmOpen} onOpenChange={setConfirmOpen} modal={true}>
          <DrawerContent className="max-w-sm mx-auto w-full p-4 rounded-t-2xl">
            <DrawerHeader>
              <DrawerTitle>Disconnect {selected?.name}?</DrawerTitle>
              <DrawerDescription>
                Disconnecting may reduce your Creator Score and remove related
                benefits. Are you sure you want to proceed?
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-2 mt-4">
              <Button
                variant="destructive"
                className="w-full"
                disabled={busy}
                onClick={async () => {
                  if (!selected) return;
                  setBusy(true);
                  try {
                    const mapped =
                      selected.source === "x_twitter"
                        ? "twitter"
                        : selected.source;
                    posthog?.capture("settings_account_disconnect_confirmed", {
                      account_type: "social",
                      platform: mapped,
                      is_own_profile: true,
                    });
                    await onAction({
                      action: "disconnect",
                      account_type: mapped as AccountManagementAction["account_type"],
                    });
                    setConfirmOpen(false);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Disconnecting..." : "Disconnect"}
              </Button>
              <Button
                variant="default"
                className="w-full"
                onClick={() => {
                  posthog?.capture("settings_account_disconnect_cancelled", {
                    account_type: "social",
                    platform: selected?.source,
                    is_own_profile: true,
                  });
                  setConfirmOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}

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
import type {
  ConnectedAccount,
  AccountManagementAction,
} from "@/app/services/types";
import { usePostHog } from "posthog-js/react";

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
  },
  {
    name: "LinkedIn",
    source: "linkedin",
    icon: Linkedin,
    color: "text-foreground",
    comingSoon: true,
  },
];

export function ConnectedSocialsSection({
  accounts,
}: ConnectedSocialsSectionProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const posthog = usePostHog();

  const handleConnect = (platform: string) => {
    // Track connect click
    posthog?.capture("settings_account_connect_clicked", {
      account_type: "social",
      platform,
      is_own_profile: true,
    });
    setModalOpen(true);
  };

  const handleDisconnect = (platform: string) => {
    // Track disconnect click
    posthog?.capture("settings_account_disconnect_clicked", {
      account_type: "social",
      platform,
      is_own_profile: true,
    });
    setModalOpen(true);
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
    </div>
  );
}

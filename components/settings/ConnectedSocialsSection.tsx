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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountManagementModal } from "@/components/modals/AccountManagementModal";
import type {
  ConnectedAccount,
  AccountManagementAction,
} from "@/app/services/types";

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
];

export function ConnectedSocialsSection({
  accounts,
}: ConnectedSocialsSectionProps) {
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleConnect = () => {
    setModalOpen(true);
  };

  const handleDisconnect = () => {
    setModalOpen(true);
  };

  const getConnectedAccount = (source: string) => {
    return accounts.find((account) => account.source === source);
  };

  return (
    <div className="space-y-3">
      {socialPlatforms.map((platform) => {
        const connectedAccount = getConnectedAccount(platform.source);
        const Icon = platform.icon;

        return (
          <div
            key={platform.source}
            className="flex items-center justify-between p-4 bg-background border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${platform.color}`} />
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

            <div className="flex items-center gap-2">
              {platform.comingSoon ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={true}
                >
                  Coming Soon
                </Button>
              ) : connectedAccount ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={false}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleConnect}
                  disabled={false}
                >
                  Connect
                </Button>
              )}
            </div>
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

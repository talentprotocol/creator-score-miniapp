"use client";

import * as React from "react";
import { Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    name: "GitHub",
    source: "github",
    icon: Github,
    color: "text-gray-700",
  },
  {
    name: "X (Twitter)",
    source: "x_twitter",
    icon: Twitter,
    color: "text-black",
  },
];

export function ConnectedSocialsSection({
  accounts,
  onAction,
}: ConnectedSocialsSectionProps) {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  const handleConnect = async (platform: string) => {
    setLoadingAction(`connect-${platform}`);
    try {
      const result = await onAction({
        action: "connect",
        account_type: platform as "github" | "twitter",
      });

      if (!result.success) {
        // Handle error silently for now
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDisconnect = async (platform: string, identifier: string) => {
    setLoadingAction(`disconnect-${platform}`);
    try {
      const result = await onAction({
        action: "disconnect",
        account_type: platform as "github" | "twitter",
        identifier,
      });

      if (!result.success) {
        // Handle error silently for now
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const getConnectedAccount = (source: string) => {
    return accounts.find((account) => account.source === source);
  };

  return (
    <div className="space-y-3">
      {socialPlatforms
        .filter((platform) => platform.source !== "x_twitter")
        .map((platform) => {
          const connectedAccount = getConnectedAccount(platform.source);
          const isLoading =
            loadingAction === `connect-${platform.source}` ||
            loadingAction === `disconnect-${platform.source}`;
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
                {connectedAccount ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDisconnect(
                        platform.source,
                        connectedAccount.identifier,
                      )
                    }
                    disabled={true}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(platform.source)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Connecting..." : "Connect"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}

      {/* X/Twitter Account - Show if connected */}
      {(() => {
        const twitterAccount = getConnectedAccount("x_twitter");
        if (!twitterAccount) return null;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _isLoading = loadingAction === "disconnect-x_twitter";

        return (
          <div className="flex items-center justify-between p-4 bg-background border rounded-lg">
            <div className="flex items-center gap-3">
              <Twitter className="h-5 w-5 text-black" />
              <div>
                <div className="font-medium text-sm">X (Twitter)</div>
                <div className="text-xs text-muted-foreground">
                  @
                  {twitterAccount.username ||
                    twitterAccount.handle ||
                    "Unknown"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  handleDisconnect("x_twitter", twitterAccount.identifier)
                }
                disabled={true}
              >
                Disconnect
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Bell, Plus, Twitter, Share2 } from "lucide-react";
import { detectClient } from "@/lib/utils";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

interface RewardsBoostsCardProps {
  talentUuid?: string | null;
  fid?: number;
}

export function RewardsBoostsCard({ talentUuid }: RewardsBoostsCardProps) {
  const { context } = useMiniKit();
  const router = useRouter();

  const handleShareStats = React.useCallback(async () => {
    if (!talentUuid) return;

    const client = await detectClient(context);

    if (client === "browser") {
      // In browser, redirect to profile page where they can access the share modal
      router.push(`/${talentUuid}/stats`);
    } else {
      // In Farcaster or Base app, show a basic share message
      try {
        const { sdk } = await import("@farcaster/frame-sdk");

        await sdk.actions.composeCast({
          text: "Check out my creator stats in the Creator Score app! 📊",
          embeds: [`https://creatorscore.app/${talentUuid}`],
        });
      } catch (error) {
        console.error("Failed to compose cast:", error);
        // Fallback to redirect
        router.push(`/${talentUuid}/stats`);
      }
    }
  }, [talentUuid, context, router]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          Rewards Boosts
        </span>
      </div>

      <div className="space-y-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Icon icon={Bell} size="sm" color="muted" />
          <span className="flex-1 text-sm text-left">Enable Notifications</span>
          <span className="text-xs text-muted-foreground">+10%</span>
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Icon icon={Plus} size="sm" color="muted" />
          <span className="flex-1 text-sm text-left">Add to Farcaster</span>
          <span className="text-xs text-muted-foreground">+15%</span>
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Icon icon={Twitter} size="sm" color="muted" />
          <span className="flex-1 text-sm text-left">Connect X</span>
          <span className="text-xs text-muted-foreground">+10%</span>
        </Link>

        <button
          onClick={handleShareStats}
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Icon icon={Share2} size="sm" color="muted" />
          <span className="flex-1 text-sm text-left">Share Score</span>
          <span className="text-xs text-muted-foreground">+10%</span>
        </button>
      </div>
    </Card>
  );
}

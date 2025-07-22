"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useProfileActions } from "@/hooks/useProfileActions";
import { Icon } from "@/components/ui/icon";
import { Bell, Twitter, Share2 } from "lucide-react";

interface RewardsBoostsCardProps {
  talentUuid?: string | null;
  fid?: number;
}

export function RewardsBoostsCard({ talentUuid }: RewardsBoostsCardProps) {
  const { handleShareStats } = useProfileActions({
    talentUUID: talentUuid || "",
  });

  const handleNotifications = async () => {
    try {
      // Use window.parent.postMessage for Farcaster notifications
      window.parent.postMessage(
        {
          type: "enableNotifications",
        },
        "*",
      );
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          Rewards Boosts
        </span>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleNotifications}
          className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Icon icon={Bell} size="sm" color="muted" />
          <span className="flex-1 text-sm text-left">Enable Notifications</span>
          <span className="text-xs text-muted-foreground">+10%</span>
        </button>

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

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Twitter,
  Linkedin,
  CircleUserRound,
  Github,
  WalletMinimal,
  Sprout,
  BadgeCheck,
} from "lucide-react";
import { sdk } from "@farcaster/frame-sdk";

interface AccountCardProps {
  platform: string;
  handle: string;
  accountAge: string;
  followers: string;
  className?: string;
  displayName?: string;
  profileUrl?: string;
}

function formatK(num: number | string): string {
  const n = typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;
  if (isNaN(n)) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const platformIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  base: WalletMinimal,
  ethereum: WalletMinimal,
  github: Github,
  farcaster: BadgeCheck,
  lens: Sprout,
  twitter: Twitter,
  linkedin: Linkedin,
};

const platformNames: Record<string, string> = {
  base: "Base",
  ethereum: "Ethereum",
  farcaster: "Farcaster",
  lens: "Lens",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  github: "GitHub",
};

export function AccountCard({
  platform,
  handle,
  accountAge,
  followers,
  className,
  displayName,
  profileUrl,
}: AccountCardProps) {
  const Icon = platformIcons[platform] || CircleUserRound;
  const platformName = displayName || platformNames[platform] || platform;
  const formattedFollowers =
    followers !== "—" && followers !== null && followers !== undefined
      ? formatK(followers)
      : "—";

  const handleClick = async (e: React.MouseEvent) => {
    if (platform === "farcaster" && profileUrl) {
      e.preventDefault();
      try {
        // Use openUrl to open the profile in the main Farcaster UI
        // The close: false parameter keeps the mini app open so user can return to it
        await sdk.actions.openUrl({ url: profileUrl, close: false });
      } catch (error) {
        console.error("Failed to open Farcaster profile:", error);
        // Fallback to regular link if SDK fails
        window.open(profileUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  const cardContent = (
    <Card
      className={cn(
        "p-2 sm:p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer",
        "bg-white border border-border/50",
        "flex flex-col justify-between min-h-[100px]",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        <div className="text-right">
          <div className="text-xs sm:text-sm text-muted-foreground">
            {platformName}
          </div>
          <div className="text-sm sm:text-base font-medium mt-0.5 truncate max-w-[120px] sm:max-w-[140px]">
            {handle}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 sm:mt-4 text-[11px] font-normal text-muted-foreground whitespace-nowrap">
        <span>{accountAge}</span>
        <span className="ml-3">
          {formattedFollowers !== "—" ? `${formattedFollowers} followers` : "—"}
        </span>
      </div>
    </Card>
  );

  return profileUrl ? (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none" }}
      onClick={handleClick}
    >
      {cardContent}
    </a>
  ) : (
    cardContent
  );
}

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn, formatK, openExternalUrl } from "@/lib/utils";
import { PLATFORM_NAMES } from "@/lib/constants";
import {
  Twitter,
  Linkedin,
  CircleUserRound,
  Github,
  WalletMinimal,
  Sprout,
  BadgeCheck,
} from "lucide-react";

interface AccountCardProps {
  platform: string;
  handle: string;
  accountAge: string;
  followers: string;
  className?: string;
  displayName?: string;
  profileUrl?: string;
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
  const platformName = displayName || PLATFORM_NAMES[platform] || platform;
  const formattedFollowers =
    followers !== "—" && followers !== null && followers !== undefined
      ? formatK(followers)
      : "—";

  const handleClick = async (e: React.MouseEvent) => {
    if (!profileUrl) return;
    e.preventDefault();

    // Handle Farcaster profiles differently (direct URL)
    if (platform === "farcaster") {
      await openExternalUrl(profileUrl);
      return;
    }

    // For all other platforms, add external parameter
    const externalUrl = `${profileUrl}${profileUrl.includes("?") ? "&" : "?"}_external=true`;
    await openExternalUrl(externalUrl);
  };

  const cardContent = (
    <Card
      className={cn(
        "p-2 sm:p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer",
        "bg-card border border-border/50",
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
      <div className="flex items-center justify-between mt-2 sm:mt-4 text-xs font-normal text-muted-foreground whitespace-nowrap">
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

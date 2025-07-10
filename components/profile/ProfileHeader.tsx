"use client";

import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { ProfileAccountsSheet } from "./ProfileAccountsSheet";
import type { SocialAccount } from "@/app/services/types";

export function ProfileHeader({
  followers,
  displayName,
  profileImage,
  bio,
  socialAccounts = [],
}: {
  followers?: string;
  displayName?: string;
  profileImage?: string;
  bio?: string;
  socialAccounts?: SocialAccount[];
}) {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const name =
    displayName || user?.displayName || user?.username || "Unknown user";
  const image =
    profileImage ||
    user?.pfpUrl ||
    "https://api.dicebear.com/7.x/identicon/svg?seed=profile";
  const fid = user?.fid; // Only use real fid, no fallback

  const [isBioExpanded, setIsBioExpanded] = React.useState(false);

  // Bio truncation logic
  const truncatedBio =
    bio && bio.length > 100 ? bio.slice(0, 100) + "..." : bio;
  const shouldShowExpand = bio && bio.length > 100;

  return (
    <div className="flex flex-col w-full gap-3">
      {/* Header with name and avatar */}
      <div className="flex items-center justify-between w-full gap-4">
        {/* Left: Name, dropdown, stats */}
        <div className="flex-1 min-w-0">
          <ProfileAccountsSheet
            name={name}
            fid={fid}
            socialAccounts={socialAccounts}
          />
          <div className="mt-1 flex flex-col gap-0.5">
            <span className="text-muted-foreground text-sm">
              {followers ?? "—"} total followers
            </span>
          </div>
        </div>
        {/* Right: Profile picture with badge overlay */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-16 w-16">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback></AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Bio section */}
      {bio && (
        <div>
          <p className="text-sm font-normal text-muted-foreground leading-relaxed">
            {isBioExpanded ? bio : truncatedBio}
          </p>
          {shouldShowExpand && (
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={() => setIsBioExpanded(!isBioExpanded)}
                className="text-xs font-normal text-muted-foreground hover:text-foreground flex items-center transition-colors"
              >
                {isBioExpanded ? "Show less" : "Show more"}
                {isBioExpanded ? (
                  <ChevronUp className="h-3 w-3 ml-0.5" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-0.5" />
                )}
              </button>
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">AI</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

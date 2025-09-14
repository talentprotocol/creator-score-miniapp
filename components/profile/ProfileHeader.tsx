"use client";

import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PfpBorder } from "@/components/ui/pfp-border";
import { ChevronUp, ChevronDown, Sparkles } from "lucide-react";

import { ProfileAccountsSheet } from "./ProfileAccountsSheet";
import type { SocialAccount } from "@/lib/types";

export function ProfileHeader({
  followers,
  displayName,
  profileImage,
  bio,
  socialAccounts = [],
  talentUUID,
  rank,
}: {
  followers?: string;
  displayName?: string;
  profileImage?: string;
  bio?: string;
  socialAccounts?: SocialAccount[];
  talentUUID?: string;
  rank?: number;
}) {
  const name = displayName || "Unknown Creator";
  const image = profileImage; // No fallback - let AvatarFallback handle it with initials

  const [isBioExpanded, setIsBioExpanded] = React.useState(false);

  // Bio truncation logic
  const truncatedBio =
    bio && bio.length > 100 ? bio.slice(0, 100) + "..." : bio;
  const shouldShowExpand = bio && bio.length > 100;

  return (
    <>
      <div className="flex flex-col w-full gap-3">
        {/* Header with name and avatar */}
        <div className="flex items-center justify-between w-full gap-4">
          {/* Left: Name, dropdown, stats */}
          <div className="flex-1 min-w-0">
            <ProfileAccountsSheet
              name={name}
              socialAccounts={socialAccounts}
              talentUUID={talentUUID}
            />
            <div className="mt-1 flex flex-col gap-0.5">
              <span className="text-muted-foreground text-sm">
                {rank && (
                  <>
                    <span className="text-muted-foreground text-sm">
                      Creator #{rank}
                    </span>
                    {" • "}
                  </>
                )}
                {followers ?? "—"} followers
              </span>
            </div>
          </div>
          {/* Right: Profile picture with badge overlay */}
          <div className="relative flex-shrink-0">
            <div className="relative h-16 w-16">
              <Avatar className="h-full w-full">
                <AvatarImage src={image} alt={name} />
                <AvatarFallback>
                  {name ? name[0]?.toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 pointer-events-none">
                <PfpBorder />
              </div>
            </div>
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
                <div className="hidden">
                  <Sparkles className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">AI</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Relevant followers - always show if available */}
      </div>
    </>
  );
}

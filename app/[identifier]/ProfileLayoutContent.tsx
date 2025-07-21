"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatCard } from "@/components/common/StatCard";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { Button } from "@/components/ui/button";
import {
  formatNumberWithSuffix,
  formatK,
  calculateTotalFollowers,
} from "@/lib/utils";
import { useProfileActions } from "@/hooks/useProfileActions";

import { Callout } from "@/components/common/Callout";
import { Share, RotateCcw, Loader2 } from "lucide-react";
import { ProfileProvider, useProfileContext } from "@/contexts/ProfileContext";

interface ProfileData {
  creatorScore: number | undefined;
  lastCalculatedAt: string | null;
  calculating: boolean;
  socialAccounts: unknown[];
  totalEarnings: number | undefined;
  posts: unknown[];
  yearlyData: { year: number; months: number[]; total: number }[];
  credentials: unknown[];
  earningsBreakdown: { totalEarnings: number; segments: unknown[] };
}

interface ProfileLayoutContentProps {
  talentUUID: string;
  identifier: string;
  children: React.ReactNode;
  profile: unknown | null; // Profile from server-side
  profileData: ProfileData; // All profile data from server-side
}

function ProfileLayoutContentInner({
  talentUUID,
  identifier,
  children,
}: {
  talentUUID: string;
  identifier: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { profile, profileData, refetchScore } = useProfileContext();

  // Extract data from server-fetched profileData
  const {
    creatorScore,
    lastCalculatedAt,
    calculating,
    socialAccounts,
    totalEarnings,
  } = profileData;

  // No loading states needed - data comes from server
  const scoreLoading = false;
  const earningsLoading = false;

  // Calculate total followers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalFollowers = calculateTotalFollowers(socialAccounts as any);

  // Check if user has score
  const hasNoScore = !creatorScore || creatorScore === 0;

  // Use profile actions hook for buttons and user logic
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isOwnProfile,
    isCalculatingOrRefreshing,
    isInCooldown,
    buttonText,
    pendingText,
    failedText,
    refreshError,
    handleShareStats,
    handleRefreshScore,
  } = useProfileActions({
    talentUUID,
    refetchScore,
    profile,
    creatorScore,
    lastCalculatedAt,
    calculating,
    totalFollowers,
    totalEarnings,
  });

  // Profile data comes from server-side, no loading state needed
  if (!profile) {
    return (
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-xl mx-auto px-4 py-6">
          <Callout>
            <strong>Error loading profile:</strong> Profile not found
          </Callout>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto relative">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <ProfileHeader
          followers={formatK(totalFollowers)}
          displayName={profile.display_name || undefined}
          profileImage={profile.image_url || undefined}
          bio={profile.bio || undefined}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          socialAccounts={socialAccounts as any}
          talentUUID={talentUUID}
          isOwnProfile={!!isOwnProfile}
          hasCreatorScore={!hasNoScore}
        />

        {/* Action buttons - show for all profiles */}
        <div className="flex flex-row gap-4 w-full -mb-2">
          <Button
            onClick={handleShareStats}
            className="flex-1 bg-black text-white hover:bg-gray-800 border-0 shadow-none"
            disabled={false}
          >
            <Share className="w-4 h-4 mr-2" />
            Share Stats
          </Button>
          <Button
            onClick={handleRefreshScore}
            variant="outline"
            className={`flex-1 bg-white border-gray-300 hover:bg-gray-50 shadow-none ${
              refreshError ? "border-red-300 text-red-500 hover:bg-red-25" : ""
            }`}
            disabled={
              isCalculatingOrRefreshing || !!refreshError || isInCooldown
            }
          >
            {isCalculatingOrRefreshing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {pendingText}
              </>
            ) : refreshError ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2 text-red-500" />
                {failedText}
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                {buttonText}
              </>
            )}
          </Button>
        </div>

        {/* Profile stat cards */}
        <div className="flex flex-row gap-4 w-full">
          <StatCard
            title="Total Earnings"
            value={
              earningsLoading
                ? "—"
                : totalEarnings === undefined
                  ? "—"
                  : formatNumberWithSuffix(totalEarnings)
            }
            onClick={() => {
              router.push(`/${identifier}/stats`);
            }}
          />
          <StatCard
            title="Creator Score"
            value={scoreLoading ? "—" : (creatorScore?.toLocaleString() ?? "—")}
            onClick={() => {
              router.push(`/${identifier}/score`);
            }}
          />
        </div>
        <ProfileTabs talentUUID={talentUUID} identifier={identifier} />
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

// Export the main component that wraps with ProfileProvider
export function ProfileLayoutContent({
  talentUUID,
  identifier,
  children,
  profile,
  profileData,
}: ProfileLayoutContentProps) {
  return (
    <ProfileProvider
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile={profile as any}
      talentUUID={talentUUID}
      identifier={identifier}
      profileData={profileData}
    >
      <ProfileLayoutContentInner
        talentUUID={talentUUID}
        identifier={identifier}
      >
        {children}
      </ProfileLayoutContentInner>
    </ProfileProvider>
  );
}

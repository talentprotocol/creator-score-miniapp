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
import { useProfileHeaderData } from "@/hooks/useProfileHeaderData";
import { useProfileCreatorScore } from "@/hooks/useProfileCreatorScore";
import { useProfileSocialAccounts } from "@/hooks/useProfileSocialAccounts";
import { useProfileTotalEarnings } from "@/hooks/useProfileTotalEarnings";
import { useProfileActions } from "@/hooks/useProfileActions";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/common/Callout";
import { Share, RotateCcw, Loader2 } from "lucide-react";

interface ProfileLayoutContentProps {
  talentUUID: string;
  identifier: string;
  children: React.ReactNode;
}

export function ProfileLayoutContent({
  talentUUID,
  identifier,
  children,
}: ProfileLayoutContentProps) {
  const router = useRouter();

  // Use hooks to fetch all data
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useProfileHeaderData(talentUUID);
  const {
    creatorScore,
    lastCalculatedAt,
    calculating,
    loading: scoreLoading,
    refetch: refetchScore,
  } = useProfileCreatorScore(talentUUID);
  const { socialAccounts } = useProfileSocialAccounts(talentUUID);
  const { totalEarnings, loading: earningsLoading } =
    useProfileTotalEarnings(talentUUID);

  // Calculate total followers
  const totalFollowers = calculateTotalFollowers(socialAccounts);

  // Use profile actions hook for buttons and user logic
  const {
    isOwnProfile,
    isCalculatingOrRefreshing,
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

  if (profileLoading) {
    return (
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
          <div className="flex flex-row gap-4 w-full">
            <Skeleton className="h-20 flex-1 rounded-xl" />
            <Skeleton className="h-20 flex-1 rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (profileError) {
    return (
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-xl mx-auto px-4 py-6">
          <Callout>
            <strong>Error loading profile:</strong> {profileError}
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
          displayName={profile?.display_name}
          profileImage={profile?.image_url}
          bio={profile?.bio}
          socialAccounts={socialAccounts}
          talentUUID={talentUUID}
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
            disabled={isCalculatingOrRefreshing || !!refreshError}
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
                : totalEarnings === null
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

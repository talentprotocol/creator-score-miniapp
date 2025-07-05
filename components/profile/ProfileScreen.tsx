"use client";

import * as React from "react";
import { ProfileHeader } from "./ProfileHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ProfileTabs } from "./ProfileTabs";
import {
  formatNumberWithSuffix,
  formatK,
  calculateTotalFollowers,
} from "@/lib/utils";
import { useProfileHeaderData } from "@/hooks/useProfileHeaderData";
import { useProfileCreatorScore } from "@/hooks/useProfileCreatorScore";
import { useProfileSocialAccounts } from "@/hooks/useProfileSocialAccounts";
import { useProfileTotalEarnings } from "@/hooks/useProfileTotalEarnings";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/Callout";

interface ProfileScreenProps {
  talentUUID: string;
  children?: React.ReactNode;
}

export function ProfileScreen({ talentUUID, children }: ProfileScreenProps) {
  // Use hooks to fetch all data
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useProfileHeaderData(talentUUID);
  const { creatorScore, loading: scoreLoading } =
    useProfileCreatorScore(talentUUID);
  const { socialAccounts } = useProfileSocialAccounts(talentUUID);
  const { totalEarnings, loading: earningsLoading } =
    useProfileTotalEarnings(talentUUID);

  // Calculate total followers
  const totalFollowers = calculateTotalFollowers(socialAccounts);

  if (profileLoading) {
    return (
      <main className="flex-1 overflow-y-auto relative">
        <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
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
        <div className="container max-w-md mx-auto px-4 py-6">
          <Callout>
            <strong>Error loading profile:</strong> {profileError}
          </Callout>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto relative">
      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <ProfileHeader
          followers={formatK(totalFollowers)}
          displayName={profile?.display_name}
          profileImage={profile?.image_url}
        />
        <div className="flex flex-row gap-4 w-full">
          <StatCard
            title="Creator Score"
            value={scoreLoading ? "—" : (creatorScore?.toLocaleString() ?? "—")}
          />
          <StatCard
            title="Total Earnings"
            value={
              earningsLoading
                ? "—"
                : totalEarnings === null
                  ? "—"
                  : formatNumberWithSuffix(totalEarnings)
            }
          />
        </div>
        <ProfileTabs
          accountsCount={socialAccounts.length}
          socialAccounts={socialAccounts}
          talentUUID={talentUUID}
        />
        {children}
      </div>
    </main>
  );
}

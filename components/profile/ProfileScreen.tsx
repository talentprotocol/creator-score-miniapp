"use client";

import * as React from "react";
import { ProfileHeader } from "./ProfileHeader";
import { StatCard } from "./StatCard";
import { ProfileTabs } from "./ProfileTabs";
import { formatNumberWithSuffix } from "@/lib/utils";
import { useProfileHeaderData } from "@/hooks/useProfileHeaderData";
import { useProfileCreatorScore } from "@/hooks/useProfileCreatorScore";
import { useProfileSocialAccounts } from "@/hooks/useProfileSocialAccounts";
import { useProfileTotalEarnings } from "@/hooks/useProfileTotalEarnings";

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
  const totalFollowers = socialAccounts.reduce(
    (sum, acc) => sum + (acc.followerCount ?? 0),
    0,
  );
  function formatK(num: number): string {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="mt-4 text-base text-muted-foreground">
          Loading profile...
        </span>
      </div>
    );
  }
  if (profileError) {
    return (
      <div className="p-8 text-center text-destructive">{profileError}</div>
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
            value={scoreLoading ? "—" : (creatorScore ?? "—")}
          />
          <StatCard
            title="Total Earnings"
            value={
              earningsLoading ? "—" : formatNumberWithSuffix(totalEarnings)
            }
          />
        </div>
        <ProfileTabs
          accountsCount={socialAccounts.length}
          socialAccounts={socialAccounts}
          fid={profile?.fid}
          wallet={profile?.wallet}
          github={profile?.github}
        />
        {children}
      </div>
    </main>
  );
}

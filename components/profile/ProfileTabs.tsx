import * as React from "react";
import { useState } from "react";
import { TabNavigation } from "@/components/ui/tabs-navigation";
import { SegmentedBar } from "@/components/ui/SegmentedBar";
import { useProfilePostsPaginated } from "@/hooks/useProfilePostsPaginated";
import { useProfileSocialAccounts } from "@/hooks/useProfileSocialAccounts";
import { useProfileEarningsBreakdown } from "@/hooks/useProfileEarningsBreakdown";
import { calculateTotalFollowers, formatRewardValue } from "@/lib/utils";
import { ScoreProgressAccordion } from "./ScoreProgressAccordion";
import { ScoreDataPoints } from "./ScoreDataPoints";
import { CredentialIdeasCallout } from "./CredentialIdeasCallout";
import { PostsList } from "./PostsList";

interface ProfileTabsProps {
  talentUUID: string;
}

export function ProfileTabs({ talentUUID }: ProfileTabsProps) {
  const {
    posts,
    loading: postsLoading,
    error: postsError,
    hasMore,
    loadMore,
  } = useProfilePostsPaginated(talentUUID, 10);
  const {
    socialAccounts,
    loading: socialAccountsLoading,
    error: socialAccountsError,
  } = useProfileSocialAccounts(talentUUID);
  const {
    breakdown: earningsBreakdown,
    loading: earningsLoading,
    error: earningsError,
  } = useProfileEarningsBreakdown(talentUUID);
  const [activeTab, setActiveTab] = useState("score");

  // Process followers breakdown
  const processFollowersBreakdown = () => {
    if (!socialAccounts || socialAccounts.length === 0) {
      return {
        totalFollowers: 0,
        segments: [],
      };
    }

    const totalFollowers = calculateTotalFollowers(socialAccounts);

    if (totalFollowers === 0) {
      return {
        totalFollowers: 0,
        segments: [],
      };
    }

    // Sort by follower count and take top 5
    const sortedAccounts = socialAccounts
      .filter((account) => account.followerCount && account.followerCount > 0)
      .sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0));

    const top5 = sortedAccounts.slice(0, 5);
    const others = sortedAccounts.slice(5);
    const otherTotal = others.reduce(
      (sum, acc) => sum + (acc.followerCount || 0),
      0,
    );

    const segments = top5.map((account) => ({
      name: account.displayName || account.source,
      value: account.followerCount || 0,
      percentage: ((account.followerCount || 0) / totalFollowers) * 100,
    }));

    if (otherTotal > 0) {
      segments.push({
        name: "Other",
        value: otherTotal,
        percentage: (otherTotal / totalFollowers) * 100,
      });
    }

    return {
      totalFollowers,
      segments,
    };
  };

  const followersBreakdown = processFollowersBreakdown();

  const tabs = [
    {
      id: "score",
      label: "Stats",
    },
    {
      id: "content",
      label: "Posts",
    },
    {
      id: "credentials",
      label: "Score",
    },
  ];

  return (
    <div className="w-full flex flex-col">
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="mt-6">
        {activeTab === "score" && (
          <div className="space-y-6">
            <SegmentedBar
              title="Total Earnings"
              total={earningsBreakdown?.totalEarnings || 0}
              segments={earningsBreakdown?.segments || []}
              color="green"
              formatValue={formatRewardValue}
              loading={earningsLoading}
              error={earningsError}
            />
            <SegmentedBar
              title="Total Followers"
              total={followersBreakdown.totalFollowers}
              segments={followersBreakdown.segments}
              color="pink"
              formatValue={(value) => value.toLocaleString()}
              loading={socialAccountsLoading}
              error={socialAccountsError}
            />
          </div>
        )}
        {activeTab === "content" && (
          <div className="space-y-6">
            <PostsList
              posts={posts}
              loading={postsLoading}
              error={postsError}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
          </div>
        )}
        {activeTab === "credentials" && (
          <div className="space-y-6">
            <ScoreProgressAccordion talentUUID={talentUUID} />
            <ScoreDataPoints talentUUID={talentUUID} />
            <CredentialIdeasCallout />
          </div>
        )}
      </div>
    </div>
  );
}

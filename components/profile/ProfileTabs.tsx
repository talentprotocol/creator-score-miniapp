import * as React from "react";
import { TabNavigation } from "@/components/common/tabs-navigation";
import { SegmentedBar } from "@/components/common/SegmentedBar";
import { useProfilePostsAll } from "@/hooks/useProfilePostsAll";
import { useProfileSocialAccounts } from "@/hooks/useProfileSocialAccounts";
import { useProfileEarningsBreakdown } from "@/hooks/useProfileEarningsBreakdown";
import { calculateTotalFollowers, formatRewardValue } from "@/lib/utils";
import { ScoreProgressAccordion } from "./ScoreProgressAccordion";
import { ScoreDataPoints } from "./ScoreDataPoints";
import { CredentialIdeasCallout } from "./CredentialIdeasCallout";
import { PostsList } from "./PostsList";
import { PostsChart } from "./PostsChart";
import { CreatorCategoryCard } from "./CreatorCategoryCard";
import type { SocialAccount } from "@/app/services/types";

interface ProfileTabsProps {
  talentUUID: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Platform URL mapping for earnings platforms
const getPlatformUrl = (
  platformName: string,
  socialAccounts: SocialAccount[],
  existingUrl?: string,
): string | undefined => {
  // First, check if we already have a URL from the data
  if (existingUrl) {
    return existingUrl;
  }

  const platform = platformName.toLowerCase();

  // For social platforms, try to find matching social account
  if (platform === "farcaster") {
    const farcasterAccount = socialAccounts.find(
      (acc) => acc.source === "farcaster",
    );
    if (farcasterAccount?.handle) {
      const handle = farcasterAccount.handle.startsWith("@")
        ? farcasterAccount.handle.slice(1)
        : farcasterAccount.handle;
      return `https://farcaster.xyz/${handle}`;
    }
  }

  // For earnings platforms, we need to construct URLs based on social accounts
  if (platform === "mirror") {
    // Mirror typically uses ENS or wallet addresses
    const ensAccount = socialAccounts.find((acc) => acc.source === "ens");
    if (ensAccount?.handle) {
      return `https://mirror.xyz/${ensAccount.handle}`;
    }
    // Could also check for wallet addresses if needed
  }

  if (platform === "zora") {
    // Zora can use ENS or wallet addresses
    const ensAccount = socialAccounts.find((acc) => acc.source === "ens");
    if (ensAccount?.handle) {
      return `https://zora.co/${ensAccount.handle}`;
    }
  }

  if (platform === "noice") {
    // Noice uses Farcaster links
    const farcasterAccount = socialAccounts.find(
      (acc) => acc.source === "farcaster",
    );
    if (farcasterAccount?.handle) {
      const handle = farcasterAccount.handle.startsWith("@")
        ? farcasterAccount.handle.slice(1)
        : farcasterAccount.handle;
      return `https://farcaster.xyz/${handle}`;
    }
  }

  return undefined;
};

export function ProfileTabs({
  talentUUID,
  activeTab,
  onTabChange,
}: ProfileTabsProps) {
  const {
    posts,
    yearlyData,
    loading: postsLoading,
    error: postsError,
  } = useProfilePostsAll(talentUUID);
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

  // Process followers breakdown with URLs
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

    // Group accounts by name and sum their followers
    const accountGroups = new Map<
      string,
      { count: number; profileUrl?: string }
    >();

    socialAccounts
      .filter((account) => account.followerCount && account.followerCount > 0)
      .forEach((account) => {
        const name = account.displayName || account.source;
        const existing = accountGroups.get(name) || {
          count: 0,
          profileUrl: undefined,
        };
        accountGroups.set(name, {
          count: existing.count + (account.followerCount || 0),
          profileUrl: existing.profileUrl || account.profileUrl || undefined,
        });
      });

    // Sort by follower count and take top 5
    const sortedAccounts = Array.from(accountGroups.entries()).sort(
      ([, a], [, b]) => b.count - a.count,
    );

    const top5 = sortedAccounts.slice(0, 5);
    const others = sortedAccounts.slice(5);
    const otherTotal = others.reduce((sum, [, data]) => sum + data.count, 0);

    const segments = top5.map(([name, data]) => ({
      name,
      value: data.count,
      percentage: (data.count / totalFollowers) * 100,
      url: data.profileUrl,
    }));

    if (otherTotal > 0) {
      segments.push({
        name: "Other",
        value: otherTotal,
        percentage: (otherTotal / totalFollowers) * 100,
        url: undefined,
      });
    }

    return {
      totalFollowers,
      segments,
    };
  };

  // Process earnings breakdown with URLs
  const processEarningsBreakdown = () => {
    if (!earningsBreakdown || !socialAccounts) {
      return earningsBreakdown;
    }

    const segmentsWithUrls = earningsBreakdown.segments.map((segment) => ({
      ...segment,
      url: getPlatformUrl(segment.name, socialAccounts),
    }));

    return {
      ...earningsBreakdown,
      segments: segmentsWithUrls,
    };
  };

  // Process posts breakdown by platform
  const processPostsBreakdown = () => {
    if (!posts || posts.length === 0) {
      return {
        totalPosts: 0,
        segments: [],
      };
    }

    // Group posts by platform
    const platformCounts = new Map<string, number>();
    posts.forEach((post) => {
      const platform = post.platform;
      platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1);
    });

    const totalPosts = posts.length;

    // Convert to segments format, only include platforms that have posts
    const segments = Array.from(platformCounts.entries())
      .map(([platform, count]) => {
        // Map platform names to display names
        const displayNames: Record<string, string> = {
          paragraph: "Paragraph",
          zora: "Zora",
          mirror: "Mirror",
          farcaster: "Farcaster",
          lens: "Lens",
        };

        return {
          name: displayNames[platform] || platform,
          value: count,
          percentage: (count / totalPosts) * 100,
          url: undefined, // Could add platform URLs later if needed
        };
      })
      .sort((a, b) => b.value - a.value); // Sort by count descending

    return {
      totalPosts,
      segments,
    };
  };

  const followersBreakdown = processFollowersBreakdown();
  const earningsBreakdownWithUrls = processEarningsBreakdown();
  const postsBreakdown = processPostsBreakdown();

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
        onTabChange={onTabChange}
      />
      <div className="mt-6">
        {activeTab === "score" && (
          <div className="space-y-6">
            <CreatorCategoryCard talentUUID={talentUUID} />
            <SegmentedBar
              title="Total Earnings"
              total={earningsBreakdownWithUrls?.totalEarnings || 0}
              segments={earningsBreakdownWithUrls?.segments || []}
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
            <SegmentedBar
              title="Total Posts"
              total={postsBreakdown.totalPosts}
              segments={postsBreakdown.segments}
              color="blue"
              formatValue={(value) => value.toLocaleString()}
              loading={postsLoading}
              error={postsError}
            />
          </div>
        )}
        {activeTab === "content" && (
          <div className="space-y-6">
            <PostsChart
              yearlyData={yearlyData}
              loading={postsLoading}
              error={postsError}
            />
            <PostsList
              posts={posts}
              loading={postsLoading}
              error={postsError}
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

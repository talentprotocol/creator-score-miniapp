"use client";

import { SegmentedBar } from "@/components/common/SegmentedBar";
import { useProfilePostsAll } from "@/hooks/useProfilePostsAll";
import { useProfileSocialAccounts } from "@/hooks/useProfileSocialAccounts";
import { useProfileEarningsBreakdown } from "@/hooks/useProfileEarningsBreakdown";
import { calculateTotalFollowers, formatRewardValue } from "@/lib/utils";
import { CreatorCategoryCard } from "@/components/profile/CreatorCategoryCard";
import { useProfileHeaderData } from "@/hooks/useProfileHeaderData";
import type { SocialAccount } from "@/app/services/types";

interface ProfileStatsPageProps {
  params: { identifier: string };
}

// Platform URL mapping for earnings platforms
const getPlatformUrl = (
  platformName: string,
  socialAccounts: SocialAccount[],
  existingUrl?: string,
): string | undefined => {
  if (existingUrl) return existingUrl;
  const platform = platformName.toLowerCase();
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
  return undefined;
};

export default function ProfileStatsPage({ params }: ProfileStatsPageProps) {
  const { profile } = useProfileHeaderData(params.identifier);
  const talentUUID = profile?.id;
  const {
    posts,
    loading: postsLoading,
    error: postsError,
  } = useProfilePostsAll(talentUUID || "");
  const {
    socialAccounts,
    loading: socialAccountsLoading,
    error: socialAccountsError,
  } = useProfileSocialAccounts(talentUUID || "");
  const {
    breakdown: earningsBreakdown,
    loading: earningsLoading,
    error: earningsError,
  } = useProfileEarningsBreakdown(talentUUID || "");

  if (!talentUUID) return <div>Loading...</div>;

  const followersBreakdown = () => {
    if (!socialAccounts?.length) return { totalFollowers: 0, segments: [] };
    const totalFollowers = calculateTotalFollowers(socialAccounts);
    if (totalFollowers === 0) return { totalFollowers: 0, segments: [] };

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
    if (otherTotal > 0)
      segments.push({
        name: "Other",
        value: otherTotal,
        percentage: (otherTotal / totalFollowers) * 100,
        url: undefined,
      });

    return { totalFollowers, segments };
  };

  const earningsBreakdownWithUrls =
    earningsBreakdown && socialAccounts
      ? {
          ...earningsBreakdown,
          segments: earningsBreakdown.segments.map((segment) => ({
            ...segment,
            url: getPlatformUrl(segment.name, socialAccounts),
          })),
        }
      : earningsBreakdown;

  const postsBreakdown = () => {
    if (!posts?.length) return { totalPosts: 0, segments: [] };
    const platformCounts = new Map<string, number>();
    posts.forEach((post) =>
      platformCounts.set(
        post.platform,
        (platformCounts.get(post.platform) || 0) + 1,
      ),
    );
    const totalPosts = posts.length;
    const displayNames: Record<string, string> = {
      paragraph: "Paragraph",
      zora: "Zora",
      mirror: "Mirror",
      farcaster: "Farcaster",
      lens: "Lens",
    };
    const segments = Array.from(platformCounts.entries())
      .map(([platform, count]) => ({
        name: displayNames[platform] || platform,
        value: count,
        percentage: (count / totalPosts) * 100,
        url: undefined,
      }))
      .sort((a, b) => b.value - a.value);
    return { totalPosts, segments };
  };

  const followersData = followersBreakdown();
  const postsData = postsBreakdown();

  return (
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
        total={followersData.totalFollowers}
        segments={followersData.segments}
        color="pink"
        formatValue={(value) => value.toLocaleString()}
        loading={socialAccountsLoading}
        error={socialAccountsError}
      />
      <SegmentedBar
        title="Total Posts"
        total={postsData.totalPosts}
        segments={postsData.segments}
        color="blue"
        formatValue={(value) => value.toLocaleString()}
        loading={postsLoading}
        error={postsError}
      />
    </div>
  );
}

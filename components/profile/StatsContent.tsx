"use client";

import { SegmentedBar } from "@/components/common/SegmentedBar";
import { calculateTotalFollowers, formatRewardValue } from "@/lib/utils";
import { useProfileContext } from "@/contexts/ProfileContext";
import type { SocialAccount } from "@/lib/types";

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

export function StatsContent() {
  const { profileData } = useProfileContext();

  // Extract data from server-fetched profileData
  const { posts, socialAccounts, earningsBreakdown } = profileData;

  // Type assertions for server data
  const typedSocialAccounts = socialAccounts as SocialAccount[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedPosts = posts as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedEarningsBreakdown = earningsBreakdown as any;

  // No loading states needed - data comes from server

  // Process followers breakdown with URLs
  const processFollowersBreakdown = () => {
    if (!socialAccounts || socialAccounts.length === 0) {
      return {
        totalFollowers: 0,
        segments: [],
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalFollowers = calculateTotalFollowers(socialAccounts as any);

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

    typedSocialAccounts
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
    if (!typedEarningsBreakdown || !typedSocialAccounts) {
      return typedEarningsBreakdown;
    }

    const segmentsWithUrls = typedEarningsBreakdown.segments.map(
      (segment: { name: string; [key: string]: unknown }) => ({
        ...segment,
        url: getPlatformUrl(segment.name, typedSocialAccounts),
      }),
    );

    return {
      ...typedEarningsBreakdown,
      segments: segmentsWithUrls,
    };
  };

  // Process posts breakdown by platform
  const processPostsBreakdown = () => {
    if (!typedPosts || typedPosts.length === 0) {
      return {
        totalPosts: 0,
        segments: [],
      };
    }

    // Group posts by platform
    const platformCounts = new Map<string, number>();
    typedPosts.forEach((post) => {
      const platform = post.platform;
      platformCounts.set(platform, (platformCounts.get(platform) || 0) + 1);
    });

    const totalPosts = typedPosts.length;

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

  // Process collectors breakdown from server data
  const processCollectorsBreakdown = () => {
    if (!profileData.collectorsBreakdown) {
      return {
        totalCollectors: 0,
        segments: [],
      };
    }

    return {
      totalCollectors: profileData.collectorsBreakdown.totalCollectors || 0,
      segments: profileData.collectorsBreakdown.segments || [],
    };
  };

  const followersBreakdown = processFollowersBreakdown();
  const earningsBreakdownWithUrls = processEarningsBreakdown();
  const postsBreakdown = processPostsBreakdown();
  const collectorsBreakdown = processCollectorsBreakdown();

  return (
    <div className="space-y-6">
      <SegmentedBar
        title="Total Earnings"
        total={earningsBreakdownWithUrls?.totalEarnings || 0}
        segments={earningsBreakdownWithUrls?.segments || []}
        color="green"
        formatValue={formatRewardValue}
        loading={false}
        error={null}
      />
      <SegmentedBar
        title="Total Collectors"
        total={collectorsBreakdown.totalCollectors}
        segments={collectorsBreakdown.segments}
        color="purple"
        formatValue={(value) => value.toLocaleString()}
        loading={false}
        error={null}
      />
      <SegmentedBar
        title="Total Followers"
        total={followersBreakdown.totalFollowers}
        segments={followersBreakdown.segments}
        color="pink"
        formatValue={(value) => value.toLocaleString()}
        loading={false}
        error={null}
      />
      <SegmentedBar
        title="Total Posts"
        total={postsBreakdown.totalPosts}
        segments={postsBreakdown.segments}
        color="blue"
        formatValue={(value) => value.toLocaleString()}
        loading={false}
        error={null}
      />
    </div>
  );
}

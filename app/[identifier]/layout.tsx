import { getTalentUserService } from "@/app/services/userService";
import { redirect } from "next/navigation";
import { RESERVED_WORDS } from "@/lib/constants";
import { CreatorNotFoundCard } from "@/components/common/CreatorNotFoundCard";
import { ProfileLayoutContent } from "./ProfileLayoutContent";
import { getCreatorScoreForTalentId } from "@/app/services/scoresService";
import { getSocialAccountsForTalentId } from "@/app/services/socialAccountsService";
import { getCredentialsForTalentId } from "@/app/services/credentialsService";
import { getAllPostsForTalentId } from "@/app/services/postsService";
import { isEarningsCredential } from "@/lib/total-earnings-config";
import {
  getEthUsdcPrice,
  convertEthToUsdc,
  formatK,
  formatNumberWithSuffix,
} from "@/lib/utils";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import {
  CACHE_KEYS,
  CACHE_DURATION_10_MINUTES,
  CACHE_DURATION_1_HOUR,
} from "@/lib/cache-keys";

export async function generateMetadata({
  params,
}: {
  params: { identifier: string };
}): Promise<Metadata> {
  if (RESERVED_WORDS.includes(params.identifier)) {
    return {
      title: "Creator Not Found - Creator Score",
      description: "This creator could not be found.",
    };
  }

  try {
    // Resolve user
    const user = await getTalentUserService(params.identifier);

    if (!user || !user.id) {
      return {
        title: "Creator Not Found - Creator Score",
        description: "This creator could not be found.",
      };
    }

    // Determine canonical identifier
    const canonical = user.fname || user.wallet || user.id;

    // Fetch basic data for metadata
    const [creatorScoreData, socialAccounts, credentials] = await Promise.all([
      unstable_cache(
        async () => getCreatorScoreForTalentId(user.id!),
        [`creator-score-${user.id!}`],
        {
          tags: [`creator-score-${user.id!}`, CACHE_KEYS.CREATOR_SCORES],
          revalidate: CACHE_DURATION_10_MINUTES,
        },
      )().catch(() => ({ score: 0 })),
      unstable_cache(
        async () => getSocialAccountsForTalentId(user.id!),
        [`social-accounts-${user.id!}`],
        {
          tags: [`social-accounts-${user.id!}`, CACHE_KEYS.SOCIAL_ACCOUNTS],
          revalidate: CACHE_DURATION_1_HOUR,
        },
      )().catch(() => []),
      unstable_cache(
        async () => getCredentialsForTalentId(user.id!),
        [`credentials-${user.id!}`],
        {
          tags: [`credentials-${user.id!}`, CACHE_KEYS.CREDENTIALS],
          revalidate: CACHE_DURATION_10_MINUTES,
        },
      )().catch(() => []),
    ]);

    // Calculate total followers
    const totalFollowers = socialAccounts.reduce((sum, account) => {
      return sum + (account.followerCount || 0);
    }, 0);

    // Calculate total earnings (simplified version for metadata)
    const ethPrice = await getEthUsdcPrice();
    const issuerTotals = new Map<string, number>();

    credentials.forEach((credentialGroup) => {
      const hasEarningsCredentials = credentialGroup.points.some((point) =>
        isEarningsCredential(point.slug || ""),
      );

      if (!hasEarningsCredentials) return;

      let issuerTotal = 0;
      credentialGroup.points.forEach((point) => {
        if (!isEarningsCredential(point.slug || "") || !point.readable_value) {
          return;
        }

        const cleanValue = point.readable_value;
        let value: number;
        const numericValue = cleanValue.replace(/[^0-9.KM-]+/g, "");

        if (numericValue.includes("K")) {
          value = parseFloat(numericValue.replace("K", "")) * 1000;
        } else if (numericValue.includes("M")) {
          value = parseFloat(numericValue.replace("M", "")) * 1000000;
        } else {
          value = parseFloat(numericValue);
        }

        if (isNaN(value)) return;

        let usdValue = 0;
        const readable = point.readable_value || "";
        const uom = point.uom || "";
        if (
          uom === "ETH" ||
          readable.includes("ETH") ||
          readable.includes("Ξ")
        ) {
          usdValue = convertEthToUsdc(value, ethPrice);
        } else if (uom === "USDC" || uom === "USD" || readable.includes("$")) {
          usdValue = value;
        }

        issuerTotal += usdValue;
      });

      if (issuerTotal > 0) {
        issuerTotals.set(credentialGroup.issuer, issuerTotal);
      }
    });

    const totalEarnings = Array.from(issuerTotals.values()).reduce(
      (sum, value) => sum + value,
      0,
    );

    const creatorScore = creatorScoreData.score || 0;
    const displayName = user.display_name || user.name || "Creator";

    // Always use canonical URL for Open Graph metadata (not localhost)
    const canonicalUrl = "https://creatorscore.app";
    const dynamicImageUrl = `${canonicalUrl}/api/share-image/${user.id}`;

    return {
      title: `${displayName} - Creator Score`,
      description: `Creator Score: ${creatorScore.toLocaleString()} • Total Earnings: ${formatNumberWithSuffix(totalEarnings)} • ${formatK(totalFollowers)} total followers`,
      openGraph: {
        title: `${displayName} - Creator Score`,
        description: `Creator Score: ${creatorScore.toLocaleString()} • Total Earnings: ${formatNumberWithSuffix(totalEarnings)} • ${formatK(totalFollowers)} total followers`,
        images: [
          {
            url: dynamicImageUrl,
            width: 1600,
            height: 900,
            alt: `${displayName} Creator Score Card`,
          },
        ],
        type: "website",
        url: `${canonicalUrl}/${canonical}`,
      },
      twitter: {
        card: "summary_large_image",
        title: `${displayName} - Creator Score`,
        description: `Creator Score: ${creatorScore.toLocaleString()} • Total Earnings: ${formatNumberWithSuffix(totalEarnings)} • ${formatK(totalFollowers)} total followers`,
        images: [dynamicImageUrl],
      },
      // Add Farcaster frame metadata for profile pages
      other: {
        "fc:frame": JSON.stringify({
          version: "next",
          imageUrl: dynamicImageUrl, // Use the custom card!
          button: {
            title: "Check Your Score",
            action: {
              type: "launch_frame",
              name: "Creator Score Mini App",
              url: canonicalUrl,
              splashImageUrl: `${canonicalUrl}/splash.png`,
              splashBackgroundColor: "#C79AF6",
            },
          },
        }),
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Creator Score",
      description: "Track your creator score and earnings onchain.",
    };
  }
}

export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { identifier: string };
}) {
  if (RESERVED_WORDS.includes(params.identifier)) {
    return <CreatorNotFoundCard />;
  }

  // Resolve user using direct service call
  const user = await getTalentUserService(params.identifier);

  if (!user || !user.id) {
    return <CreatorNotFoundCard />;
  }

  // Determine canonical human-readable identifier: Farcaster, Wallet, else UUID
  const canonical = user.fname || user.wallet || user.id;
  const rank = user.rank as number | null;

  if (
    canonical &&
    params.identifier !== canonical &&
    params.identifier !== undefined
  ) {
    // Preserve the current path when redirecting to canonical
    const currentPath = params.identifier;
    if (currentPath.includes("/")) {
      const pathParts = currentPath.split("/");
      const tabPart = pathParts[pathParts.length - 1];
      redirect(`/${canonical}/${tabPart}`);
    } else {
      redirect(`/${canonical}/stats`);
    }
  }

  // 🚀 FETCH ALL PROFILE DATA HERE (server-side, once)
  const [creatorScoreData, socialAccounts, credentials, posts] =
    await Promise.all([
      unstable_cache(
        async () => getCreatorScoreForTalentId(user.id!),
        [`creator-score-${user.id!}`],
        {
          tags: [`creator-score-${user.id!}`, CACHE_KEYS.CREATOR_SCORES],
          revalidate: CACHE_DURATION_10_MINUTES,
        },
      )().catch(() => ({
        score: 0,
        level: 1,
        levelName: "Level 1",
        lastCalculatedAt: null,
        calculating: false,
      })),
      unstable_cache(
        async () => getSocialAccountsForTalentId(user.id!),
        [`social-accounts-${user.id!}`],
        {
          tags: [`social-accounts-${user.id!}`, CACHE_KEYS.SOCIAL_ACCOUNTS],
          revalidate: CACHE_DURATION_1_HOUR,
        },
      )().catch(() => []),
      unstable_cache(
        async () => getCredentialsForTalentId(user.id!),
        [`credentials-${user.id!}`],
        {
          tags: [`credentials-${user.id!}`, CACHE_KEYS.CREDENTIALS],
          revalidate: CACHE_DURATION_10_MINUTES,
        },
      )().catch(() => []),
      unstable_cache(
        async () => getAllPostsForTalentId(user.id!),
        [`posts-${user.id!}`],
        {
          tags: [`posts-${user.id!}`, CACHE_KEYS.POSTS],
          revalidate: CACHE_DURATION_1_HOUR,
        },
      )().catch(() => []),
    ]);

  // Process posts into yearly data (same logic as hooks)
  const yearlyDataMap = posts.reduce(
    (acc: Record<number, number[]>, post: { onchain_created_at: string }) => {
      const date = new Date(post.onchain_created_at);
      const year = date.getFullYear();
      const month = date.getMonth();

      if (!acc[year]) {
        acc[year] = new Array(12).fill(0);
      }
      acc[year][month]++;
      return acc;
    },
    {},
  );

  // Convert to YearlyPostData format
  const yearlyData = Object.entries(yearlyDataMap).map(([year, months]) => ({
    year: parseInt(year),
    months: months as number[],
    total: (months as number[]).reduce((sum, count) => sum + count, 0),
  }));

  // Calculate total earnings using the same sophisticated logic as the original system
  const ethPrice = await getEthUsdcPrice();
  const issuerTotals = new Map<string, number>();

  // Process each credential group (same logic as useProfileEarningsBreakdown)
  credentials.forEach((credentialGroup) => {
    // Check if any point in this group is earnings-related
    const hasEarningsCredentials = credentialGroup.points.some((point) =>
      isEarningsCredential(point.slug || ""),
    );

    if (!hasEarningsCredentials) {
      return;
    }

    let issuerTotal = 0;

    // Calculate total for this issuer
    credentialGroup.points.forEach((point) => {
      if (!isEarningsCredential(point.slug || "")) {
        return;
      }
      if (!point.readable_value) return;

      // Parse credential-level readable_value only
      const cleanValue = point.readable_value;
      let value: number;
      const numericValue = cleanValue.replace(/[^0-9.KM-]+/g, "");

      if (numericValue.includes("K")) {
        value = parseFloat(numericValue.replace("K", "")) * 1000;
      } else if (numericValue.includes("M")) {
        value = parseFloat(numericValue.replace("M", "")) * 1000000;
      } else {
        value = parseFloat(numericValue);
      }

      if (isNaN(value)) return;

      // Convert to USD using credential-level uom only
      let usdValue = 0;
      const uom = point.uom || "";
      if (uom === "ETH") {
        usdValue = convertEthToUsdc(value, ethPrice);
      } else if (uom === "USDC" || uom === "USD") {
        usdValue = value;
      }

      issuerTotal += usdValue;
    });

    if (issuerTotal > 0) {
      issuerTotals.set(credentialGroup.issuer, issuerTotal);
    }
  });

  // Calculate total earnings from earnings-related credentials only
  const totalEarnings = Array.from(issuerTotals.values()).reduce(
    (sum, value) => sum + value,
    0,
  );

  // Create earnings breakdown (only from earnings-related credentials)
  const sortedIssuers = Array.from(issuerTotals.entries()).sort(
    ([, a], [, b]) => b - a,
  );

  const earningsBreakdown = {
    totalEarnings,
    segments: sortedIssuers.map(([issuer, value]) => ({
      name: issuer,
      value,
      percentage: totalEarnings > 0 ? (value / totalEarnings) * 100 : 0,
    })),
  };

  return (
    <ProfileLayoutContent
      talentUUID={user.id}
      identifier={canonical}
      profile={user}
      // 🎯 PASS ALL DATA AS PROPS (no more API calls needed)
      profileData={{
        creatorScore: creatorScoreData.score,
        lastCalculatedAt: creatorScoreData.lastCalculatedAt,
        calculating: creatorScoreData.calculating || false,
        socialAccounts,
        totalEarnings,
        posts,
        yearlyData,
        credentials,
        earningsBreakdown,
        rank,
      }}
    >
      {children}
    </ProfileLayoutContent>
  );
}

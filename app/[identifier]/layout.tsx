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
  getPolUsdPrice,
  convertEthToUsdc,
  convertPolToUsdc,
  formatCompactNumber,
  formatNumberWithSuffix,
} from "@/lib/utils";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_30_MINUTES } from "@/lib/cache-keys";
import { dlog, dtimer } from "@/lib/debug";

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
      getCreatorScoreForTalentId(user.id!)().catch(() => ({ score: 0 })),
      getSocialAccountsForTalentId(user.id!)().catch((error) => {
        console.error("[Profile Layout] Data fetch failed:", error);
        throw error; // Don't cache failures - allow retries
      }),
      unstable_cache(
        async () => getCredentialsForTalentId(user.id!),
        [`credentials-${user.id!}`],
        {
          tags: [`credentials-${user.id!}`, CACHE_KEYS.CREDENTIALS],
          revalidate: CACHE_DURATION_30_MINUTES,
        },
      )().catch((error) => {
        console.error("[Profile Layout] Data fetch failed:", error);
        throw error; // Don't cache failures - allow retries
      }),
    ]);

    // Calculate total followers
    const totalFollowers = socialAccounts.reduce((sum, account) => {
      return sum + (account.followerCount || 0);
    }, 0);

    // Calculate total earnings (simplified version for metadata)
    const [ethPrice, polPrice] = await Promise.all([
      getEthUsdcPrice(),
      getPolUsdPrice(),
    ]);
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
        } else if (
          uom === "$POL" ||
          uom === "POL" ||
          uom === "MATIC" ||
          readable.includes("POL")
        ) {
          usdValue = convertPolToUsdc(value, polPrice);
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
      description: `Creator Score: ${creatorScore.toLocaleString()} • Total Earnings: ${formatNumberWithSuffix(totalEarnings)} • ${formatCompactNumber(totalFollowers)} total followers`,
      openGraph: {
        title: `${displayName} - Creator Score`,
        description: `Creator Score: ${creatorScore.toLocaleString()} • Total Earnings: ${formatNumberWithSuffix(totalEarnings)} • ${formatCompactNumber(totalFollowers)} total followers`,
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
        description: `Creator Score: ${creatorScore.toLocaleString()} • Total Earnings: ${formatNumberWithSuffix(totalEarnings)} • ${formatCompactNumber(totalFollowers)} total followers`,
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
  const layoutTimer = dtimer("ProfileLayout", "total");

  dlog("ProfileLayout", "start", {
    identifier: params.identifier,
    isReserved: RESERVED_WORDS.includes(params.identifier),
  });

  if (RESERVED_WORDS.includes(params.identifier)) {
    dlog("ProfileLayout", "reserved_word_redirect", {
      identifier: params.identifier,
    });
    layoutTimer.end();
    return <CreatorNotFoundCard />;
  }

  // Resolve user using direct service call
  const userResolutionTimer = dtimer("ProfileLayout", "user_resolution");
  dlog("ProfileLayout", "calling_getTalentUserService", {
    identifier: params.identifier,
  });

  const user = await getTalentUserService(params.identifier);

  dlog("ProfileLayout", "getTalentUserService_result", {
    identifier: params.identifier,
    user_found: !!user,
    user_id: user?.id || null,
    user_fname: user?.fname || null,
    user_wallet: user?.wallet || null,
  });

  userResolutionTimer.end();

  if (!user || !user.id) {
    dlog("ProfileLayout", "user_not_found_rendering_creator_not_found", {
      identifier: params.identifier,
      user_null: user === null,
      user_no_id: user && !user.id,
    });
    layoutTimer.end();
    return <CreatorNotFoundCard />;
  }

  // Determine canonical human-readable identifier: Farcaster, Wallet, else UUID
  const canonical = user.fname || user.wallet || user.id;
  const rank = user.rank as number | null;

  dlog("ProfileLayout", "user_resolved", {
    identifier: params.identifier,
    canonical,
    user_id: user.id,
    rank,
    will_redirect: canonical !== params.identifier,
  });

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
      const redirectUrl = `/${canonical}/${tabPart}`;
      dlog("ProfileLayout", "redirecting_to_canonical_with_tab", {
        from: currentPath,
        to: redirectUrl,
        tab: tabPart,
      });
      redirect(redirectUrl);
    } else {
      const redirectUrl = `/${canonical}/stats`;
      dlog("ProfileLayout", "redirecting_to_canonical_default_tab", {
        from: currentPath,
        to: redirectUrl,
      });
      redirect(redirectUrl);
    }
  }

  // 🚀 FETCH ALL PROFILE DATA HERE (server-side, once)
  const dataFetchTimer = dtimer("ProfileLayout", "data_fetch_bundle");
  dlog("ProfileLayout", "fetch_bundle_start", { user_id: user.id });

  const [creatorScoreData, socialAccounts, credentials, posts] =
    await Promise.all([
      getCreatorScoreForTalentId(user.id!)().catch((error) => {
        dlog("ProfileLayout", "creator_score_fetch_failed", {
          user_id: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
        return {
          score: 0,
          level: 1,
          levelName: "Level 1",
          lastCalculatedAt: null,
          calculating: false,
        };
      }),
      getSocialAccountsForTalentId(user.id!)().catch((error) => {
        dlog("ProfileLayout", "social_accounts_fetch_failed", {
          user_id: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Don't cache failures - allow retries
      }),
      unstable_cache(
        async () => getCredentialsForTalentId(user.id!),
        [`credentials-${user.id!}`],
        {
          tags: [`credentials-${user.id!}`, CACHE_KEYS.CREDENTIALS],
          revalidate: CACHE_DURATION_30_MINUTES,
        },
      )().catch((error) => {
        dlog("ProfileLayout", "credentials_fetch_failed", {
          user_id: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Don't cache failures - allow retries
      }),
      getAllPostsForTalentId(user.id!)().catch((error) => {
        dlog("ProfileLayout", "posts_fetch_failed", {
          user_id: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Don't cache failures - allow retries
      }),
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
  const [ethPrice, polPrice] = await Promise.all([
    getEthUsdcPrice(),
    getPolUsdPrice(),
  ]);
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

      // Parse credential-level readable_value using the utility function
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
      } else if (uom === "$POL" || uom === "POL" || uom === "MATIC") {
        usdValue = convertPolToUsdc(value, polPrice);
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

  // Calculate total followers
  const totalFollowers = socialAccounts.reduce((sum, account) => {
    return sum + (account.followerCount || 0);
  }, 0);

  dataFetchTimer.end();

  dlog("ProfileLayout", "fetch_bundle_complete", {
    user_id: user.id,
    creator_score: creatorScoreData.score,
    calculating: creatorScoreData.calculating || false,
    social_accounts_count: socialAccounts.length,
    credentials_groups_count: credentials.length,
    posts_count: posts.length,
    total_followers: totalFollowers,
    total_earnings: totalEarnings,
    earnings_segments_count: earningsBreakdown.segments.length,
  });

  // Data sanity warnings
  if (creatorScoreData.score > 0 && earningsBreakdown.segments.length === 0) {
    dlog("ProfileLayout", "data_inconsistency_warning", {
      user_id: user.id,
      warning: "creator_score_positive_but_no_earnings_segments",
      creator_score: creatorScoreData.score,
      credentials_groups_count: credentials.length,
    });
  }

  if (
    totalFollowers === 0 &&
    socialAccounts.some((acc) =>
      ["farcaster", "twitter", "lens"].includes(acc.source),
    )
  ) {
    dlog("ProfileLayout", "data_inconsistency_warning", {
      user_id: user.id,
      warning: "social_accounts_exist_but_zero_followers",
      social_accounts_count: socialAccounts.length,
      social_sources: socialAccounts.map((acc) => acc.source),
    });
  }

  const renderTimer = dtimer("ProfileLayout", "render");
  const result = (
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

  renderTimer.end();
  layoutTimer.end();

  dlog("ProfileLayout", "successfully_rendered", {
    user_id: user.id,
    identifier: params.identifier,
    canonical,
  });

  return result;
}

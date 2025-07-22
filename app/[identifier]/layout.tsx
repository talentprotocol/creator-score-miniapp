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
      getCreatorScoreForTalentId(user.id).catch(() => ({ score: 0 })),
      getSocialAccountsForTalentId(user.id).catch(() => []),
      getCredentialsForTalentId(user.id).catch(() => []),
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
        if (
          !isEarningsCredential(point.slug || "") ||
          !point.readable_value ||
          !point.uom
        ) {
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
        if (point.uom === "ETH") {
          usdValue = convertEthToUsdc(value, ethPrice);
        } else if (point.uom === "USDC") {
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
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://creatorscore.app";

    return {
      title: `${displayName} - Creator Score`,
      description: `Creator Score: ${creatorScore.toLocaleString()} • Total Earnings: ${formatNumberWithSuffix(totalEarnings)} • ${formatK(totalFollowers)} total followers`,
      openGraph: {
        title: `${displayName} - Creator Score`,
        description: `Creator Score: ${creatorScore.toLocaleString()} • Total Earnings: ${formatNumberWithSuffix(totalEarnings)} • ${formatK(totalFollowers)} total followers`,
        images: [
          {
            url: `${baseUrl}/api/share-image/${user.id}`,
            width: 1600,
            height: 900,
            alt: `${displayName} Creator Score Card`,
          },
        ],
        type: "website",
        url: `${baseUrl}/${canonical}`,
      },
      twitter: {
        card: "summary_large_image",
        title: `${displayName} - Creator Score`,
        description: `Creator Score: ${creatorScore.toLocaleString()} • Total Earnings: ${formatNumberWithSuffix(totalEarnings)} • ${formatK(totalFollowers)} total followers`,
        images: [`${baseUrl}/api/share-image/${user.id}`],
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
      getCreatorScoreForTalentId(user.id).catch(() => ({
        score: 0,
        level: 1,
        levelName: "Level 1",
        lastCalculatedAt: null,
        calculating: false,
      })),
      getSocialAccountsForTalentId(user.id).catch(() => []),
      getCredentialsForTalentId(user.id).catch(() => []),
      getAllPostsForTalentId(user.id).catch(() => []),
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

      if (!point.readable_value || !point.uom) {
        return;
      }

      // Parse the value (same logic as useProfileEarningsBreakdown)
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

      if (isNaN(value)) {
        return;
      }

      // Convert to USD (same logic as useProfileEarningsBreakdown)
      let usdValue = 0;
      if (point.uom === "ETH") {
        usdValue = convertEthToUsdc(value, ethPrice);
      } else if (point.uom === "USDC") {
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

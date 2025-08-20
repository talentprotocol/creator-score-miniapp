import React from "react";
import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { talentApiClient } from "@/lib/talent-api-client";
import {
  CACHE_KEYS,
  CACHE_DURATION_10_MINUTES,
  CACHE_DURATION_1_HOUR,
} from "@/lib/cache-keys";
import {
  calculateTotalFollowers,
  convertEthToUsdc,
  convertPolToUsdc,
  getEthUsdcPrice,
  getPolUsdPrice,
  formatK,
} from "@/lib/utils";
import { getSocialAccountsForTalentId } from "@/app/services/socialAccountsService";
import { getCredentialsForTalentId } from "@/app/services/credentialsService";
import { getCreatorScoreForTalentId } from "@/app/services/scoresService";
import { isEarningsCredential } from "@/lib/total-earnings-config";
import { RewardsCalculationService } from "@/app/services/rewardsCalculationService";
import { getTop200LeaderboardEntries } from "@/app/services/leaderboardService";
import type { LeaderboardEntry } from "@/app/services/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { talentUUID: string } },
) {
  try {
    // Fetch user data (PRESERVED EXACTLY)
    const profileResponse = await unstable_cache(
      async () => {
        const response = await talentApiClient.getProfile({
          talent_protocol_id: params.talentUUID,
        });

        // Check if profile exists and parse immediately
        if (!response.ok) {
          throw new Error(`Profile not found: ${response.status}`);
        }

        const profileData = await response.json();
        return { ok: true, data: profileData };
      },
      [`profile-${params.talentUUID}`],
      {
        tags: [`profile-${params.talentUUID}`, CACHE_KEYS.TALENT_PROFILES],
        revalidate: CACHE_DURATION_10_MINUTES,
      },
    )();

    // Check if profile exists (PRESERVED EXACTLY)
    if (!profileResponse.ok) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Parse the profile data from the response (PRESERVED EXACTLY)
    const profileData = profileResponse.data;

    // Fetch additional data (PRESERVED EXACTLY)
    const [socialAccounts, credentials, creatorScoreData, leaderboardResponse] =
      await Promise.all([
        unstable_cache(
          async () => getSocialAccountsForTalentId(params.talentUUID),
          [`social-accounts-${params.talentUUID}`],
          {
            tags: [
              `social-accounts-${params.talentUUID}`,
              CACHE_KEYS.SOCIAL_ACCOUNTS,
            ],
            revalidate: CACHE_DURATION_1_HOUR,
          },
        )().catch(() => []),
        unstable_cache(
          async () => getCredentialsForTalentId(params.talentUUID),
          [`credentials-${params.talentUUID}`],
          {
            tags: [`credentials-${params.talentUUID}`, CACHE_KEYS.CREDENTIALS],
            revalidate: CACHE_DURATION_10_MINUTES,
          },
        )().catch(() => []),
        unstable_cache(
          async () => getCreatorScoreForTalentId(params.talentUUID),
          [`creator-score-${params.talentUUID}`],
          {
            tags: [
              `creator-score-${params.talentUUID}`,
              CACHE_KEYS.CREATOR_SCORES,
            ],
            revalidate: CACHE_DURATION_10_MINUTES,
          },
        )().catch(() => ({
          score: 0,
        })),
        unstable_cache(
          async () => getTop200LeaderboardEntries(),
          ["leaderboard"],
          {
            tags: ["leaderboard"],
            revalidate: CACHE_DURATION_10_MINUTES,
          },
        )().catch(() => ({ entries: [] })),
      ]);

    // Extract leaderboard entries from response
    const leaderboardData = leaderboardResponse.entries || [];

    // Calculate stats (PRESERVED EXACTLY)
    const totalFollowers = calculateTotalFollowers(socialAccounts);
    const creatorScore = creatorScoreData.score || 0;

    // Calculate total earnings (PRESERVED EXACTLY - same logic as layout.tsx)
    const [ethPrice, polPrice] = await Promise.all([
      getEthUsdcPrice(),
      getPolUsdPrice(),
    ]);

    const issuerTotals = new Map<string, number>();

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
        if (!isEarningsCredential(point.slug || "")) return;
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
        if (point.uom === "ETH") {
          usdValue = convertEthToUsdc(value, ethPrice);
        } else if (
          point.uom === "$POL" ||
          point.uom === "POL" ||
          point.uom === "MATIC"
        ) {
          usdValue = convertPolToUsdc(value, polPrice);
        } else if (point.uom === "USDC" || point.uom === "USD") {
          usdValue = value;
        }

        issuerTotal += usdValue;
      });

      if (issuerTotal > 0) {
        issuerTotals.set(credentialGroup.issuer, issuerTotal);
      }
    });

    // Total earnings calculation preserved for potential future use
    // const totalEarnings = Array.from(issuerTotals.values()).reduce(
    //   (sum, value) => sum + value,
    //   0,
    // );

    // Calculate current rewards (same logic as PayItForwardSection.tsx)
    const userLeaderboardEntry = leaderboardData.find(
      (entry: LeaderboardEntry) =>
        entry.talent_protocol_id === params.talentUUID,
    );

    const currentRewards = userLeaderboardEntry
      ? RewardsCalculationService.calculateUserReward(
          userLeaderboardEntry.score,
          userLeaderboardEntry.rank,
          userLeaderboardEntry.isBoosted || false,
          false, // not opted out yet for display
          leaderboardData,
        )
      : "N/A";

    // Prepare data for image generation
    const displayName =
      profileData.display_name || profileData.name || "Creator";
    const avatar = profileData.image_url;

    // Always use canonical URL for sharing, but allow localhost for font loading in dev
    const canonicalUrl = "https://www.creatorscore.app";
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.NEXT_PUBLIC_URL || canonicalUrl;

    // Strip emojis (PRESERVED EXACTLY from Canvas version)
    const cleanName = displayName.replace(
      /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27FF]|[\u2300-\u23FF]|[\u2000-\u206F]|[\u2100-\u214F]/g,
      "",
    );

    // OPT-OUT SHARING: Always use bg-optout.png background
    const backgroundImage = "bg-optout.png";

    // Load fonts from web URLs (works in both dev and production)
    const [cyRegular, cyBold, cySemiBold, cyExtraBold] = await Promise.all([
      fetch(`${baseUrl}/fonts/Cy Regular.ttf`).then((res) => res.arrayBuffer()),
      fetch(`${baseUrl}/fonts/Cy Bold.ttf`).then((res) => res.arrayBuffer()),
      fetch(`${baseUrl}/fonts/Cy SemiBold.ttf`).then((res) =>
        res.arrayBuffer(),
      ),
      fetch(`${baseUrl}/fonts/Cy ExtraBold.ttf`).then((res) =>
        res.arrayBuffer(),
      ),
    ]);

    // Generate image with @vercel/og (REPLACING Canvas)
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            position: "relative",
            backgroundImage: `url(${baseUrl}/images/share/${backgroundImage})`,
            backgroundSize: "1600px 900px",
            backgroundRepeat: "no-repeat",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Avatar - using exact Figma coordinates */}
          {avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt="Creator avatar"
              style={{
                position: "absolute",
                left: 205,
                top: 101,
                width: 239,
                height: 239,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          )}

          {/* Name text - using exact Canvas coordinates converted to @vercel/og */}
          <div
            style={{
              position: "absolute",
              left: 470,
              top: 145,
              fontSize: 66,
              fontFamily: "Cy",
              fontWeight: 800,
              color: "#000000",
              lineHeight: 1,
              display: "flex",
            }}
          >
            {cleanName}
          </div>

          {/* Total followers text - using exact Canvas coordinates converted */}
          <div
            style={{
              position: "absolute",
              left: 470,
              top: 230,
              fontSize: 36,
              fontFamily: "Cy",
              fontWeight: 600,
              color: "#6C7587",
              lineHeight: 1,
              display: "flex",
            }}
          >
            {formatK(totalFollowers)} total followers
          </div>

          {/* Creator Score label - using exact Figma coordinates */}
          <div
            style={{
              position: "absolute",
              left: 434,
              top: 395,
              fontSize: 32,
              fontFamily: "Cy",
              fontWeight: 700,
              color: "#6C7587",
              lineHeight: 1,
              textAlign: "center",
              width: 200,
              display: "flex",
              justifyContent: "center",
              whiteSpace: "nowrap",
            }}
          >
            Creator Score
          </div>

          {/* Creator Score number - using exact Canvas coordinates converted */}
          <div
            style={{
              position: "absolute",
              left: 384, // Adjusted for center alignment (533.5 - ~150)
              top: 435, // Adjusted from Canvas baseline to @vercel/og positioning
              fontSize: 100,
              fontFamily: "Cy",
              fontWeight: 800,
              color: "#000000",
              lineHeight: 1,
              textAlign: "center",
              width: 300,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {creatorScore.toLocaleString()}
          </div>

          {/* Total Rewards label - using exact Figma coordinates */}
          <div
            style={{
              position: "absolute",
              left: 999,
              top: 395,
              fontSize: 32,
              fontFamily: "Cy",
              fontWeight: 700,
              color: "#6C7587",
              lineHeight: 1,
              textAlign: "center",
              width: 200,
              display: "flex",
              justifyContent: "center",
              whiteSpace: "nowrap",
            }}
          >
            Total Rewards
          </div>

          {/* Total Rewards number - using exact Canvas coordinates converted */}
          <div
            style={{
              position: "absolute",
              left: 949, // Adjusted for center alignment (1098.5 - ~150)
              top: 435, // Adjusted from Canvas baseline to @vercel/og positioning
              fontSize: 100,
              fontFamily: "Cy",
              fontWeight: 800,
              color: "#86B966", // text-brand-green equivalent
              lineHeight: 1,
              textAlign: "center",
              width: 300,
              display: "flex",
              justifyContent: "center",
              textDecoration: "line-through",
            }}
          >
            {currentRewards}
          </div>
        </div>
      ),
      {
        width: 1600,
        height: 900,
        fonts: [
          {
            name: "Cy",
            data: cyRegular,
            weight: 400,
          },
          {
            name: "Cy",
            data: cyBold,
            weight: 700,
          },
          {
            name: "Cy",
            data: cySemiBold,
            weight: 600,
          },
          {
            name: "Cy",
            data: cyExtraBold,
            weight: 800,
          },
        ],
        headers: {
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );

    return imageResponse;
  } catch (error) {
    console.error("Error generating opt-out share image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { talentApiClient } from "@/lib/talent-api-client";
import {
  calculateTotalFollowers,
  convertEthToUsdc,
  getEthUsdcPrice,
} from "@/lib/utils";
import { generateShareImage } from "@/lib/share-image-generator";
import { getSocialAccountsForTalentId } from "@/app/services/socialAccountsService";
import { getCredentialsForTalentId } from "@/app/services/credentialsService";
import { getCreatorScoreForTalentId } from "@/app/services/scoresService";
import { isEarningsCredential } from "@/lib/total-earnings-config";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_1_HOUR } from "@/lib/cache-keys";

export async function GET(
  req: NextRequest,
  { params }: { params: { talentUUID: string } },
) {
  try {
    // Wrap the data fetching and calculation in unstable_cache with a key including the talentUUID
    // Import unstable_cache at the top if not already imported:

    const getShareImageData = unstable_cache(
      async (talentUUID: string) => {
        // Fetch user data
        const profileResponse = await talentApiClient.getProfile({
          talent_protocol_id: talentUUID,
        });

        // Check if profile exists
        if (!profileResponse.ok) {
          return { error: "Profile not found", notFound: true };
        }

        // Parse the profile data from the response
        const profileData = await profileResponse.json();

        // Fetch additional data
        const [socialAccounts, credentials, creatorScoreData] =
          await Promise.all([
            getSocialAccountsForTalentId(talentUUID).catch(() => []),
            getCredentialsForTalentId(talentUUID).catch(() => []),
            getCreatorScoreForTalentId(talentUUID).catch(() => ({ score: 0 })),
          ]);

        // Calculate stats
        const totalFollowers = calculateTotalFollowers(socialAccounts);
        const creatorScore = creatorScoreData.score || 0;

        // Calculate total earnings (same logic as layout.tsx)
        const ethPrice = await getEthUsdcPrice();
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
            if (!isEarningsCredential(point.slug || "")) {
              return;
            }

            if (!point.readable_value || !point.uom) {
              return;
            }

            // Parse the value
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

            // Convert to USD
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

        return {
          profileData,
          totalFollowers,
          creatorScore,
          totalEarnings,
        };
      },
      [`${CACHE_KEYS.SHARE_IMAGE_DATA}-${params.talentUUID}`],
      { revalidate: CACHE_DURATION_1_HOUR },
    );

    const shareImageData = await getShareImageData(params.talentUUID);

    if (shareImageData?.notFound) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { profileData, totalFollowers, creatorScore, totalEarnings } =
      shareImageData;

    // Generate image
    const imageBuffer = await generateShareImage({
      avatar: profileData.image_url,
      name: profileData.display_name || profileData.name || "Creator",
      totalFollowers: totalFollowers || 0,
      creatorScore: creatorScore || 0,
      totalEarnings: totalEarnings || 0,
    });

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating share image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 },
    );
  }
}

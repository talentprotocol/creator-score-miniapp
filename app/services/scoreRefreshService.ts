import { BOOST_CONFIG } from "@/lib/constants";
import { getDataPointsSum } from "./dataPointsService";

export interface TokenBalanceData {
  balance: number;
  lastUpdated: string;
  isBoosted: boolean;
}

/**
 * Fetch token balance for a single profile (for manual refresh)
 */
export async function getTokenBalanceForProfileManual(
  profileId: string,
  _apiKey: string, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<TokenBalanceData> {
  try {
    // Use the new dataPointsService instead of direct API call
    const balance = await getDataPointsSum(profileId, [
      "talent_protocol_talent_holder",
    ]);

    const isBoosted = balance >= BOOST_CONFIG.TOKEN_THRESHOLD;
    const lastUpdated = new Date().toISOString();

    return { balance, lastUpdated, isBoosted };
  } catch {
    return {
      balance: 0,
      lastUpdated: new Date().toISOString(),
      isBoosted: false,
    };
  }
}

/**
 * Triggers Creator Score calculation for a Talent Protocol ID
 */
export async function triggerScoreCalculation(
  talentId: string | number,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Always use relative path to avoid CORS issues and ensure we use our API routes
    let baseUrl = "";
    if (typeof window !== "undefined") {
      // Client-side: use relative path to ensure we call our own API routes
      baseUrl = "";
    } else {
      // Server-side: use the current origin
      baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_URL || "";
    }

    const requestBody = {
      talent_protocol_id: String(talentId),
    };

    const response = await fetch(`${baseUrl}/api/talent-score-refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      message: data.score || "Score and token balance refreshed",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to trigger score calculation",
    };
  }
}

import { parseFormattedNumber } from "@/lib/utils";
import { BOOST_CONFIG } from "@/lib/constants";

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
  apiKey: string,
): Promise<TokenBalanceData> {
  console.log(
    `🔄 [SCORE REFRESH SERVICE] Starting manual token balance refresh for profile ${profileId}`,
  );
  console.log(
    `🔧 [SCORE REFRESH SERVICE] Using boost threshold: ${BOOST_CONFIG.TOKEN_THRESHOLD} tokens`,
  );

  try {
    console.log(
      `🔄 [SCORE REFRESH SERVICE] Fetching token data points for profile ${profileId}`,
    );
    console.log(
      `🔗 [SCORE REFRESH SERVICE] API endpoint: https://api.talentprotocol.com/data_points?id=${profileId}&slugs=talent_protocol_talent_holder`,
    );

    const res = await fetch(
      `https://api.talentprotocol.com/data_points?id=${profileId}&slugs=talent_protocol_talent_holder`,
      {
        headers: {
          Accept: "application/json",
          "X-API-KEY": apiKey,
        },
      },
    );

    if (!res.ok) {
      console.warn(
        `⚠️ [SCORE REFRESH SERVICE] Failed to fetch token data points for profile ${profileId} - status: ${res.status}`,
      );
      console.log(
        `📋 [SCORE REFRESH SERVICE] Response status: ${res.status}, statusText: ${res.statusText}`,
      );
      return {
        balance: 0,
        lastUpdated: new Date().toISOString(),
        isBoosted: false,
      };
    }

    const json = await res.json();
    console.log(
      `✅ [SCORE REFRESH SERVICE] Received data points for profile ${profileId}`,
    );
    console.log(
      `📊 [SCORE REFRESH SERVICE] Raw response structure: ${JSON.stringify(Object.keys(json))}`,
    );

    if (!json.data_points || json.data_points.length === 0) {
      console.warn(
        `⚠️ [SCORE REFRESH SERVICE] No token data points found for profile ${profileId}`,
      );
      console.log(
        `📋 [SCORE REFRESH SERVICE] Response data: ${JSON.stringify(json)}`,
      );
      return {
        balance: 0,
        lastUpdated: new Date().toISOString(),
        isBoosted: false,
      };
    }

    console.log(
      `📊 [SCORE REFRESH SERVICE] Found ${json.data_points.length} data points for profile ${profileId}`,
    );

    // Sum all readable_values for token balance
    console.log(
      `🔍 [SCORE REFRESH SERVICE] Processing data points for balance calculation...`,
    );
    const balance = json.data_points.reduce(
      (sum: number, dp: { readable_value?: string }) => {
        const readableValue = dp.readable_value || "0";
        const parsedValue = parseFormattedNumber(readableValue);
        console.log(
          `💰 [SCORE REFRESH SERVICE] Data point: readable_value="${readableValue}" -> parsed=${parsedValue}`,
        );
        return sum + parsedValue;
      },
      0,
    );

    const isBoosted = balance >= BOOST_CONFIG.TOKEN_THRESHOLD;
    const lastUpdated = new Date().toISOString();

    console.log(
      `🎯 [SCORE REFRESH SERVICE] Profile ${profileId} token balance: ${balance}, isBoosted: ${isBoosted}`,
    );
    console.log(
      `🏆 [SCORE REFRESH SERVICE] Boost calculation: ${balance} >= ${BOOST_CONFIG.TOKEN_THRESHOLD} = ${isBoosted}`,
    );

    return { balance, lastUpdated, isBoosted };
  } catch (error) {
    console.warn(
      `❌ [SCORE REFRESH SERVICE] Error fetching token balance for profile ${profileId}:`,
      error,
    );
    console.log(
      `📋 [SCORE REFRESH SERVICE] Error details: ${error instanceof Error ? error.message : String(error)}`,
    );
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
  console.log(
    `🔄 [SCORE REFRESH SERVICE] Starting score calculation trigger for talent ID: ${talentId}`,
  );

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

    console.log(
      `🔄 [SCORE REFRESH SERVICE] Triggering score calculation API call for talent ID: ${talentId}`,
    );

    const response = await fetch(`${baseUrl}/api/talent-score-refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        `❌ [SCORE REFRESH SERVICE] Score calculation failed for talent ID ${talentId} - status: ${response.status}`,
      );
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    console.log(
      `✅ [SCORE REFRESH SERVICE] Score calculation successful for talent ID ${talentId}`,
    );

    console.log(
      `✅ [SCORE REFRESH SERVICE] Complete refresh operation successful for talent ID: ${talentId}`,
    );

    return {
      success: true,
      message: data.score || "Score and token balance refreshed",
    };
  } catch (error) {
    console.error(
      `❌ [SCORE REFRESH SERVICE] Failed to trigger score calculation for talent ID ${talentId}:`,
      error,
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to trigger score calculation",
    };
  }
}

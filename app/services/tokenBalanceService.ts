import { unstable_cache } from "next/cache";

export interface TokenBalanceData {
  balance: number;
  lastUpdated: string;
  isBoosted: boolean;
}

export interface TokenBalanceCache {
  tokenBalances: Record<string, TokenBalanceData>;
  lastUpdated: string;
  nextUpdate: string;
}

import { parseFormattedNumber } from "@/lib/utils";

/**
 * Fetch token balance for a single profile
 */
async function getTokenBalanceForProfile(
  profileId: string,
  apiKey: string,
): Promise<TokenBalanceData> {
  try {
    const res = await fetch(
      `https://api.talentprotocol.com/credentials?id=${profileId}&scorer_slug=creator_score`,
      {
        headers: {
          Accept: "application/json",
          "X-API-KEY": apiKey,
        },
      },
    );

    if (!res.ok) {
      console.warn(`Failed to fetch credentials for profile ${profileId}`);
      return {
        balance: 0,
        lastUpdated: new Date().toISOString(),
        isBoosted: false,
      };
    }

    const json = await res.json();
    const tokenCredential = json.credentials?.find(
      (c: { slug: string }) => c.slug === "talent_protocol_talent_holder",
    );

    if (!tokenCredential?.points_calculation_logic?.data_points) {
      return {
        balance: 0,
        lastUpdated: new Date().toISOString(),
        isBoosted: false,
      };
    }

    // Sum all readable_values for token balance
    const balance = tokenCredential.points_calculation_logic.data_points.reduce(
      (sum: number, dp: { readable_value?: string }) => {
        const readableValue = dp.readable_value || "0";
        return sum + parseFormattedNumber(readableValue);
      },
      0,
    );

    const isBoosted = balance >= 1000;
    const lastUpdated = new Date().toISOString();

    return { balance, lastUpdated, isBoosted };
  } catch (error) {
    console.warn(
      `Error fetching token balance for profile ${profileId}:`,
      error,
    );
    return {
      balance: 0,
      lastUpdated: new Date().toISOString(),
      isBoosted: false,
    };
  }
}

/**
 * Fetch top 200 profiles for token balance calculation
 */
async function fetchTop200Profiles(
  apiKey: string,
): Promise<Array<{ id: string }>> {
  const baseUrl = "https://api.talentprotocol.com/search/advanced/profiles";
  const batchSize = 200;
  let allProfiles: Array<{ id: string }> = [];

  for (let page = 1; allProfiles.length < 200; page++) {
    const data = {
      query: {
        score: {
          min: 1,
          scorer: "Creator Score",
        },
      },
      sort: {
        score: { order: "desc", scorer: "Creator Score" },
        id: { order: "desc" },
      },
      page,
      per_page: batchSize,
    };

    const queryString = [
      `query=${encodeURIComponent(JSON.stringify(data.query))}`,
      `sort=${encodeURIComponent(JSON.stringify(data.sort))}`,
      `page=${page}`,
      `per_page=${batchSize}`,
      `view=scores_minimal`,
    ].join("&");

    const res = await fetch(`${baseUrl}?${queryString}`, {
      headers: {
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Error for page ${page}:`, errorText);
      throw new Error(`Failed to fetch page ${page}: ${errorText}`);
    }

    const json = await res.json();
    const profiles = json.profiles || [];
    allProfiles = [...allProfiles, ...profiles];

    // Break if we got fewer results than requested
    if (profiles.length < batchSize) break;

    // Add a small delay between requests
    if (page < Math.ceil(200 / batchSize)) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return allProfiles.slice(0, 200);
}

/**
 * Get cached token balances with 24-hour TTL
 * FIXED: Proper cache key strategy for development mode
 */
export const getCachedTokenBalances = unstable_cache(
  async (apiKey: string): Promise<TokenBalanceCache> => {
    console.log("🔄 Fetching fresh token balances for all top 200 creators...");

    try {
      // Fetch top 200 profiles
      const profiles = await fetchTop200Profiles(apiKey);
      const tokenBalances: Record<string, TokenBalanceData> = {};

      // Fetch token balances for all profiles in parallel (with rate limiting)
      const batchSize = 10;
      for (let i = 0; i < profiles.length; i += batchSize) {
        const batch = profiles.slice(i, i + batchSize);
        const batchPromises = batch.map((profile) =>
          getTokenBalanceForProfile(profile.id, apiKey),
        );

        const batchResults = await Promise.all(batchPromises);

        batch.forEach((profile, index) => {
          tokenBalances[profile.id] = batchResults[index];
        });

        // Add delay between batches to be nice to the API
        if (i + batchSize < profiles.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      const lastUpdated = new Date().toISOString();
      const nextUpdate = new Date(
        Date.now() + 6 * 60 * 60 * 1000,
      ).toISOString(); // 6 hours from now

      const boostedCount = Object.values(tokenBalances).filter(
        (data) => data.isBoosted,
      ).length;

      console.log(
        `✅ Token balance cache updated: ${Object.keys(tokenBalances).length} profiles, ${boostedCount} boosted`,
      );

      return {
        tokenBalances,
        lastUpdated,
        nextUpdate,
      };
    } catch (error) {
      console.error("❌ Error updating token balance cache:", error);
      throw error;
    }
  },
  ["token-balances-v2"], // FIXED: Unique cache key to avoid conflicts
  {
    revalidate: 24 * 60 * 60, // 24 hours TTL
    tags: ["token-balances"], // FIXED: Add tags for cache invalidation
  },
);

/**
 * Get token balance for a specific profile (for manual refresh)
 */
export async function getTokenBalanceForProfileManual(
  profileId: string,
  apiKey: string,
): Promise<TokenBalanceData> {
  return getTokenBalanceForProfile(profileId, apiKey);
}

import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_1_HOUR } from "@/lib/cache-keys";

interface DataPoint {
  account_identifier: string;
  account_source: string;
  created_at: string;
  credential_slug: string;
  readable_value: string;
  recalculated_at: string;
  updated_at: string;
}

interface DataPointsResponse {
  data_points: DataPoint[];
}

/**
 * Get user's token balance by summing all talent_protocol_talent_holder and talent_vault data points
 */
async function getUserTokenBalanceFromAPI(
  apiKey: string,
  talentUuid: string,
): Promise<number> {
  const baseUrl = "https://api.talentprotocol.com";

  // Fetch data points for both token types
  const tokenSlugs = ["talent_protocol_talent_holder", "talent_vault"];
  let totalBalance = 0;

  for (const slug of tokenSlugs) {
    try {
      const response = await fetch(
        `${baseUrl}/data_points?id=${talentUuid}&slugs=${slug}`,
        {
          headers: {
            Accept: "application/json",
            "X-API-KEY": apiKey,
          },
        },
      );

      if (!response.ok) {
        continue; // Skip this slug if it fails
      }

      const data: DataPointsResponse = await response.json();

      // Sum all readable_values for this credential type
      const slugBalance = data.data_points.reduce((sum, dp) => {
        const value = parseFloat(dp.readable_value) || 0;
        return sum + value;
      }, 0);

      totalBalance += slugBalance;
    } catch {
      // Continue with other slugs even if one fails
    }
  }

  return totalBalance;
}

/**
 * Cached function to get user's token balance
 */
export function getCachedUserTokenBalance(talentUuid: string) {
  return unstable_cache(
    async (apiKey: string): Promise<number> => {
      try {
        const balance = await getUserTokenBalanceFromAPI(apiKey, talentUuid);
        return balance;
      } catch (error) {
        throw error;
      }
    },
    [`${CACHE_KEYS.USER_TOKEN_BALANCE}-${talentUuid}`],
    {
      revalidate: CACHE_DURATION_1_HOUR,
      tags: [`${CACHE_KEYS.USER_TOKEN_BALANCE}-${talentUuid}`],
    },
  );
}

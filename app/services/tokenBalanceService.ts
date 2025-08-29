import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_1_HOUR } from "@/lib/cache-keys";
import { getDataPointsSum } from "./dataPointsService";

/**
 * Get user's token balance by summing all talent_protocol_talent_holder and talent_vault data points
 */
async function getUserTokenBalanceFromAPI(
  apiKey: string,
  talentUuid: string,
): Promise<number> {
  if (!apiKey) {
    return 0;
  }

  // Use the new dataPointsService to get both token types
  const tokenSlugs = ["talent_protocol_talent_holder", "talent_vault"];
  let totalBalance = 0;

  for (const slug of tokenSlugs) {
    try {
      const slugBalance = await getDataPointsSum(talentUuid, [slug]);
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

import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";

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
 * Get data points for specific credential slugs from Talent API
 * Similar to getCredentialsForTalentId but fetches from /data_points endpoint
 */
async function getDataPointsForTalentId(
  apiKey: string,
  talentUuid: string,
  slugs: string[],
): Promise<DataPoint[]> {
  if (!apiKey || !talentUuid || !slugs.length) {
    return [];
  }

  const baseUrl = "https://api.talentprotocol.com";
  const slugsParam = slugs.join(",");

  try {
    const response = await fetch(
      `${baseUrl}/data_points?id=${encodeURIComponent(talentUuid)}&slugs=${encodeURIComponent(slugsParam)}`,
      {
        headers: {
          Accept: "application/json",
          "X-API-KEY": apiKey,
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data: DataPointsResponse = await response.json();
    return data.data_points || [];
  } catch (error) {
    console.error("Failed to fetch data points:", error);
    return [];
  }
}

/**
 * Get sum of readable_values for specific credential slugs
 * Useful for badges that need numeric totals (e.g., base_out_transactions)
 */
export async function getDataPointsSum(
  talentUuid: string,
  slugs: string[],
): Promise<number> {
  if (!process.env.TALENT_API_KEY) {
    return 0;
  }

  const dataPoints = await getDataPointsForTalentId(
    process.env.TALENT_API_KEY,
    talentUuid,
    slugs,
  );

  return dataPoints.reduce((sum, dp) => {
    const value = dp.readable_value ? parseFloat(dp.readable_value) : 0;
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);
}

/**
 * Cached version of getDataPointsSum with 5-minute cache
 */
export function getCachedDataPointsSum(talentUuid: string, slugs: string[]) {
  return unstable_cache(
    async (): Promise<number> => {
      return getDataPointsSum(talentUuid, slugs);
    },
    [`${CACHE_KEYS.DATA_POINTS_SUM}-${talentUuid}-${slugs.join(",")}`],
    {
      revalidate: CACHE_DURATION_5_MINUTES,
      tags: [`${CACHE_KEYS.DATA_POINTS_SUM}-${talentUuid}`],
    },
  );
}

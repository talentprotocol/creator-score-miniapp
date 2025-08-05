import { unstable_cache } from "next/cache";

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
  console.log(
    `🔄 [TOKEN BALANCE SERVICE] Starting token balance fetch for user ${talentUuid}`,
  );

  const baseUrl = "https://api.talentprotocol.com";

  // Fetch data points for both token types
  const tokenSlugs = ["talent_protocol_talent_holder", "talent_vault"];
  let totalBalance = 0;

  console.log(
    `📊 [TOKEN BALANCE SERVICE] Fetching data points for ${tokenSlugs.length} token types: ${tokenSlugs.join(", ")}`,
  );

  for (const slug of tokenSlugs) {
    try {
      console.log(
        `🔄 [TOKEN BALANCE SERVICE] Fetching ${slug} data points for user ${talentUuid}`,
      );

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
        const errorText = await response.text();
        console.error(
          `❌ [TOKEN BALANCE SERVICE] Data points API error for ${slug}:`,
          errorText,
        );
        console.warn(
          `⚠️ [TOKEN BALANCE SERVICE] Skipping ${slug} due to API error`,
        );
        continue; // Skip this slug if it fails
      }

      const data: DataPointsResponse = await response.json();
      console.log(
        `✅ [TOKEN BALANCE SERVICE] Received ${data.data_points.length} data points for ${slug}`,
      );

      // Sum all readable_values for this credential type
      const slugBalance = data.data_points.reduce((sum, dp) => {
        const value = parseFloat(dp.readable_value) || 0;
        return sum + value;
      }, 0);

      console.log(
        `🎯 [TOKEN BALANCE SERVICE] Found ${data.data_points.length} data points for ${slug}, total: ${slugBalance.toFixed(2)}`,
      );

      totalBalance += slugBalance;
      console.log(
        `🎯 [TOKEN BALANCE SERVICE] User ${talentUuid} has ${slugBalance.toFixed(2)} ${slug} tokens`,
      );
    } catch (error) {
      console.error(
        `❌ [TOKEN BALANCE SERVICE] Error fetching ${slug} data points:`,
        error,
      );
      console.warn(
        `⚠️ [TOKEN BALANCE SERVICE] Continuing with other slugs even if ${slug} fails`,
      );
      // Continue with other slugs even if one fails
    }
  }

  console.log(
    `🎯 [TOKEN BALANCE SERVICE] User ${talentUuid} has ${totalBalance.toFixed(2)} total tokens`,
  );

  return totalBalance;
}

/**
 * Cached function to get user's token balance
 */
export const getCachedUserTokenBalance = unstable_cache(
  async (apiKey: string, talentUuid: string): Promise<number> => {
    console.log(
      `🔄 [TOKEN BALANCE SERVICE] Fetching token balance for user ${talentUuid}...`,
    );

    try {
      const balance = await getUserTokenBalanceFromAPI(apiKey, talentUuid);
      console.log(
        `✅ [TOKEN BALANCE SERVICE] User token balance: ${balance.toFixed(2)}`,
      );
      return balance;
    } catch (error) {
      console.error(
        "❌ [TOKEN BALANCE SERVICE] Error fetching user token balance:",
        error,
      );
      throw error;
    }
  },
  ["user-token-balance"],
  {
    revalidate: 60 * 60, // 1 hour cache
    tags: ["user-token-balance"],
  },
);

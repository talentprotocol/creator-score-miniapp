import "server-only";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_1_HOUR } from "@/lib/cache-keys";
import { supabase } from "@/lib/supabase-client";
import { getEthUsdcPrice, convertEthToUsdc } from "@/lib/utils";
import {
  BasecampProfile,
  BasecampStats,
  SortColumn,
  SortOrder,
  BasecampTab,
} from "@/lib/types/basecamp";

// Get latest calculation date
async function getLatestCalculationDate(): Promise<string> {
  const { data, error } = await supabase
    .from("base200_leaderboard")
    .select("calculation_date")
    .order("calculation_date", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    throw new Error("No calculation data available");
  }

  return data[0].calculation_date;
}

// Get previous calculation date for delta calculations
async function getPreviousCalculationDate(
  currentDate: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("base200_leaderboard")
    .select("calculation_date")
    .lt("calculation_date", currentDate)
    .order("calculation_date", { ascending: false })
    .limit(1);

  if (error || !data?.length) return null;
  return data[0].calculation_date;
}

// Get leaderboard with pagination and sorting
export async function getBasecampLeaderboard(
  offset: number = 0,
  limit: number = 50,
  sortBy: SortColumn = "creator_score",
  sortOrder: SortOrder = "desc",
  tab: BasecampTab = "creator",
): Promise<{ profiles: BasecampProfile[]; total: number; hasMore: boolean }> {
  return unstable_cache(
    async () => {
      const latestDate = await getLatestCalculationDate();

      // For builder tab sorting by builder metrics, we need to handle sorting differently
      const isBuilderMetricSort =
        sortBy === "rewards_amount" || sortBy === "smart_contracts_deployed";

      // Build query with filters
      let query = supabase
        .from("base200_leaderboard")
        .select("*", { count: "exact" })
        .eq("calculation_date", latestDate)
        .eq("basecamp_002_participant", true)
        .not("display_name", "is", null);

      // Add coin filtering for coins tab
      if (tab === "coins") {
        query = query.not("zora_creator_coin_address", "is", null);
      }

      // Only add sorting if it's not a builder metric sort
      if (!isBuilderMetricSort) {
        query = query
          .order(sortBy, { ascending: sortOrder === "asc", nullsFirst: false })
          .range(offset, offset + limit - 1);
      } else {
        // For builder metrics, fetch more data and sort later
        query = query.order("creator_score", { ascending: false });
      }

      const { data: currentData, error, count } = await query;
      if (error) throw error;

      // For coins tab, calculate holder deltas
      let profiles = currentData || [];

      if (tab === "coins" && currentData?.length) {
        const previousDate = await getPreviousCalculationDate(latestDate);

        if (previousDate) {
          // Get previous day's holder counts for the same users
          const talentUuids = currentData.map((p) => p.talent_uuid);

          const { data: previousData } = await supabase
            .from("base200_leaderboard")
            .select("talent_uuid, zora_creator_coin_unique_holders")
            .eq("calculation_date", previousDate)
            .in("talent_uuid", talentUuids);

          // Create lookup map for previous data
          const previousHolders = new Map(
            previousData?.map((p) => [
              p.talent_uuid,
              p.zora_creator_coin_unique_holders,
            ]) || [],
          );

          // Calculate deltas and add to profiles
          profiles = currentData.map((profile) => {
            const currentHolders =
              profile.zora_creator_coin_unique_holders || 0;
            const prevHolders = previousHolders.get(profile.talent_uuid) || 0;
            const holdersDelta = currentHolders - prevHolders;

            return {
              ...profile,
              zora_creator_coin_holders_24h_delta: holdersDelta,
            };
          });
        } else {
          // No previous data available, set all deltas to 0
          profiles = currentData.map((profile) => ({
            ...profile,
            zora_creator_coin_holders_24h_delta: 0,
          }));
        }
      } else {
        // No rank calculation needed for desktop tables
        profiles = currentData || [];
      }

      // Add rewards and contracts data from database
      // Following coding principles: Single query instead of N+1 lookups
      const talentUuids = profiles.map((p) => p.talent_uuid);

      const { data: builderMetrics } = await supabase
        .from("basecamp_builder_metrics")
        .select("talent_uuid, smart_contracts_deployed, builder_rewards_eth")
        .eq("calculation_date", "2025-09-13") // Use current date for builder metrics
        .in("talent_uuid", talentUuids);

      // Get ETH price for conversion
      const ethPrice = await getEthUsdcPrice();

      // Create lookup map for builder metrics
      const metricsMap = new Map(
        builderMetrics?.map((m) => [m.talent_uuid, m]) || [],
      );

      // Merge builder metrics with profiles, converting ETH to USD
      let profilesWithRewards = profiles.map((profile) => {
        const metrics = metricsMap.get(profile.talent_uuid);
        const ethRewards = metrics?.builder_rewards_eth || 0;
        const usdRewards = convertEthToUsdc(ethRewards, ethPrice);
        return {
          ...profile,
          rewards_amount: usdRewards,
          smart_contracts_deployed: metrics?.smart_contracts_deployed || 0,
        };
      });

      // Handle builder metric sorting
      if (isBuilderMetricSort) {
        // Sort by the builder metric
        profilesWithRewards.sort((a, b) => {
          const aValue =
            sortBy === "rewards_amount"
              ? a.rewards_amount
              : a.smart_contracts_deployed;
          const bValue =
            sortBy === "rewards_amount"
              ? b.rewards_amount
              : b.smart_contracts_deployed;

          if (sortOrder === "asc") {
            return (aValue || 0) - (bValue || 0);
          } else {
            return (bValue || 0) - (aValue || 0);
          }
        });

        // Apply pagination after sorting
        const total = profilesWithRewards.length;
        profilesWithRewards = profilesWithRewards.slice(offset, offset + limit);

        return {
          profiles: profilesWithRewards,
          total,
          hasMore: offset + limit < total,
        };
      }

      return {
        profiles: profilesWithRewards,
        total: count || 0,
        hasMore: offset + limit < (count || 0),
      };
    },
    [
      CACHE_KEYS.LEADERBOARD +
        `-basecamp-${tab}-${offset}-${limit}-${sortBy}-${sortOrder}`,
    ],
    {
      revalidate: CACHE_DURATION_1_HOUR,
      tags: [CACHE_KEYS.LEADERBOARD + "-basecamp"],
    },
  )();
}

// Get aggregated statistics
export async function getBasecampStats(): Promise<BasecampStats> {
  return unstable_cache(
    async () => {
      const latestDate = await getLatestCalculationDate();
      const previousDate = await getPreviousCalculationDate(latestDate);

      // Get current data (basecamp participants with creator coins only)
      const { data: currentData, error: currentError } = await supabase
        .from("base200_leaderboard")
        .select("*")
        .eq("calculation_date", latestDate)
        .eq("basecamp_002_participant", true)
        .not("display_name", "is", null)
        .not("zora_creator_coin_address", "is", null);

      if (currentError) throw currentError;

      // Get previous data for delta calculations
      let previousData = null;
      if (previousDate) {
        const { data: prevData, error: prevError } = await supabase
          .from("base200_leaderboard")
          .select(
            "talent_uuid, zora_creator_coin_address, zora_creator_coin_unique_holders",
          )
          .eq("calculation_date", previousDate)
          .eq("basecamp_002_participant", true)
          .not("display_name", "is", null)
          .not("zora_creator_coin_address", "is", null);

        if (!prevError) previousData = prevData;
      }

      // Calculate new metrics
      const newMetrics = calculateNewMetrics(currentData || [], previousData);

      // Get existing metrics (builder rewards, contracts, etc.) in parallel
      const [builderMetricsData] = await Promise.all([
        supabase
          .from("basecamp_builder_metrics")
          .select("smart_contracts_deployed, builder_rewards_eth")
          .eq("calculation_date", "2025-09-13"), // Use current date for builder metrics
      ]);

      if (builderMetricsData.error) throw builderMetricsData.error;

      // Get ETH price for conversion
      const ethPrice = await getEthUsdcPrice();

      // Calculate builder metrics totals, converting ETH to USD
      const builderStats = builderMetricsData.data?.reduce(
        (acc, record) => {
          const ethRewards = Number(record.builder_rewards_eth) || 0;
          const usdRewards = convertEthToUsdc(ethRewards, ethPrice);
          return {
            totalBuilderRewards: acc.totalBuilderRewards + usdRewards,
            totalContractsDeployed:
              acc.totalContractsDeployed +
              (record.smart_contracts_deployed || 0),
          };
        },
        { totalBuilderRewards: 0, totalContractsDeployed: 0 },
      ) || { totalBuilderRewards: 0, totalContractsDeployed: 0 };

      return {
        totalBuilderRewards: builderStats.totalBuilderRewards,
        totalContractsDeployed: builderStats.totalContractsDeployed,
        totalMarketCap: newMetrics.marketCapTotal,
        totalCreatorEarnings:
          currentData?.reduce((sum, p) => sum + (p.total_earnings || 0), 0) ||
          0,
        calculationDate: latestDate,
        ...newMetrics,
      };
    },
    [CACHE_KEYS.LEADERBOARD + "-basecamp-stats"],
    {
      revalidate: CACHE_DURATION_1_HOUR,
      tags: [CACHE_KEYS.LEADERBOARD + "-basecamp"],
    },
  )();
}

function calculateNewMetrics(
  currentData: BasecampProfile[],
  previousData:
    | {
        talent_uuid: string;
        zora_creator_coin_address: string | null;
        zora_creator_coin_unique_holders: number | null;
      }[]
    | null,
) {
  // Coins Launched Today: Count new zora_creator_coin_address
  const previousCoinAddresses = new Set(
    previousData?.map((p) => p.zora_creator_coin_address).filter(Boolean) || [],
  );
  const coinsLaunchedToday = currentData.filter(
    (p) =>
      p.zora_creator_coin_address &&
      !previousCoinAddresses.has(p.zora_creator_coin_address),
  ).length;

  // Market Cap Today: Sum of 24h market cap changes
  const marketCapToday = currentData.reduce(
    (sum, p) => sum + (p.zora_creator_coin_market_cap_24h || 0),
    0,
  );

  // Volume Today: Sum of 24h volume
  const volumeToday = currentData.reduce(
    (sum, p) => sum + (p.zora_creator_coin_24h_volume || 0),
    0,
  );

  // Holders Change Today: Net change in unique holders
  const previousHolders = new Map(
    previousData?.map((p) => [
      p.talent_uuid,
      p.zora_creator_coin_unique_holders,
    ]) || [],
  );
  const holdersChangeToday = currentData.reduce((sum, p) => {
    const current = p.zora_creator_coin_unique_holders || 0;
    const previous = previousHolders.get(p.talent_uuid) || 0;
    return sum + (current - previous);
  }, 0);

  return {
    coinsLaunchedToday,
    coinsLaunchedTotal: currentData.length,
    marketCapToday,
    marketCapTotal: currentData.reduce(
      (sum, p) => sum + (p.zora_creator_coin_market_cap || 0),
      0,
    ),
    volumeToday,
    volumeTotal: currentData.reduce(
      (sum, p) => sum + (p.zora_creator_coin_total_volume || 0),
      0,
    ),
    holdersChangeToday,
    holdersTotal: currentData.reduce(
      (sum, p) => sum + (p.zora_creator_coin_unique_holders || 0),
      0,
    ),
  };
}

// Check if coins tab should be visible
export async function hasCreatorCoins(): Promise<boolean> {
  return unstable_cache(
    async () => {
      const latestDate = await getLatestCalculationDate();

      const { count } = await supabase
        .from("base200_leaderboard")
        .select("talent_uuid", { count: "exact" })
        .eq("calculation_date", latestDate)
        .eq("basecamp_002_participant", true)
        .not("display_name", "is", null)
        .not("zora_creator_coin_address", "is", null);

      return (count || 0) > 0;
    },
    [CACHE_KEYS.LEADERBOARD + "-basecamp-has-coins"],
    {
      revalidate: CACHE_DURATION_1_HOUR,
      tags: [CACHE_KEYS.LEADERBOARD + "-basecamp"],
    },
  )();
}

// Note: getUserBasecampRank function removed - now using simple client-side ranking

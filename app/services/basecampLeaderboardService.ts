import "server-only";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_1_HOUR } from "@/lib/cache-keys";
import { supabase } from "@/lib/supabase-client";
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

      // Create lookup map for builder metrics
      const metricsMap = new Map(
        builderMetrics?.map((m) => [m.talent_uuid, m]) || [],
      );

      // Merge builder metrics with profiles
      let profilesWithRewards = profiles.map((profile) => {
        const metrics = metricsMap.get(profile.talent_uuid);
        return {
          ...profile,
          rewards_amount: metrics?.builder_rewards_eth || 0,
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

      // Get basecamp leaderboard stats in parallel with builder metrics
      const [basecampData, builderMetricsData] = await Promise.all([
        supabase
          .from("base200_leaderboard")
          .select("talent_uuid, zora_creator_coin_market_cap, total_earnings")
          .eq("calculation_date", latestDate)
          .eq("basecamp_002_participant", true)
          .not("display_name", "is", null),

        supabase
          .from("basecamp_builder_metrics")
          .select("smart_contracts_deployed, builder_rewards_eth")
          .eq("calculation_date", "2025-09-13"), // Use current date for builder metrics
      ]);

      if (basecampData.error) throw basecampData.error;
      if (builderMetricsData.error) throw builderMetricsData.error;

      // Calculate basecamp stats
      const basecampStats = basecampData.data?.reduce(
        (acc, record) => ({
          totalMarketCap:
            acc.totalMarketCap + (record.zora_creator_coin_market_cap || 0),
          totalCreatorEarnings:
            acc.totalCreatorEarnings + (record.total_earnings || 0),
        }),
        { totalMarketCap: 0, totalCreatorEarnings: 0 },
      ) || { totalMarketCap: 0, totalCreatorEarnings: 0 };

      // Calculate builder metrics totals
      const builderStats = builderMetricsData.data?.reduce(
        (acc, record) => ({
          totalBuilderRewards:
            acc.totalBuilderRewards + (Number(record.builder_rewards_eth) || 0),
          totalContractsDeployed:
            acc.totalContractsDeployed + (record.smart_contracts_deployed || 0),
        }),
        { totalBuilderRewards: 0, totalContractsDeployed: 0 },
      ) || { totalBuilderRewards: 0, totalContractsDeployed: 0 };

      return {
        totalBuilderRewards: builderStats.totalBuilderRewards,
        totalContractsDeployed: builderStats.totalContractsDeployed,
        totalMarketCap: basecampStats.totalMarketCap,
        totalCreatorEarnings: basecampStats.totalCreatorEarnings,
        calculationDate: latestDate,
      };
    },
    [CACHE_KEYS.LEADERBOARD + "-basecamp-stats"],
    {
      revalidate: CACHE_DURATION_1_HOUR,
      tags: [CACHE_KEYS.LEADERBOARD + "-basecamp"],
    },
  )();
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

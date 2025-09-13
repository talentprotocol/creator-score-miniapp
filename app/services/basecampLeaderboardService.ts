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
  tab: BasecampTab = "reputation",
): Promise<{ profiles: BasecampProfile[]; total: number; hasMore: boolean }> {
  return unstable_cache(
    async () => {
      const latestDate = await getLatestCalculationDate();

      // Build query with filters and sorting
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

      query = query
        .order(sortBy, { ascending: sortOrder === "asc", nullsFirst: false })
        .range(offset, offset + limit - 1);

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
      }

      return {
        profiles: profiles,
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

      const { data, error } = await supabase
        .from("base200_leaderboard")
        .select(
          `
          talent_uuid,
          zora_creator_coin_market_cap,
          total_earnings
        `,
        )
        .eq("calculation_date", latestDate)
        .eq("basecamp_002_participant", true)
        .not("display_name", "is", null);

      if (error) throw error;

      const stats = data?.reduce(
        (
          acc: {
            totalAttendees: number;
            totalCreatorCoins: number;
            totalMarketCap: number;
            totalCreatorEarnings: number;
          },
          record: {
            zora_creator_coin_market_cap?: number | null;
            total_earnings?: number | null;
          },
        ) => ({
          totalAttendees: acc.totalAttendees + 1,
          totalCreatorCoins: record.zora_creator_coin_market_cap
            ? acc.totalCreatorCoins + 1
            : acc.totalCreatorCoins,
          totalMarketCap:
            acc.totalMarketCap + (record.zora_creator_coin_market_cap || 0),
          totalCreatorEarnings:
            acc.totalCreatorEarnings + (record.total_earnings || 0),
        }),
        {
          totalAttendees: 0,
          totalCreatorCoins: 0,
          totalMarketCap: 0,
          totalCreatorEarnings: 0,
        },
      ) || {
        totalAttendees: 0,
        totalCreatorCoins: 0,
        totalMarketCap: 0,
        totalCreatorEarnings: 0,
      };

      return {
        ...stats,
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

// Get user's rank for pinned display
export async function getUserBasecampRank(
  talentUuid: string,
  tab: BasecampTab = "reputation",
): Promise<BasecampProfile | null> {
  return unstable_cache(
    async () => {
      const latestDate = await getLatestCalculationDate();

      const { data, error } = await supabase
        .from("base200_leaderboard")
        .select("*")
        .eq("calculation_date", latestDate)
        .eq("basecamp_002_participant", true)
        .eq("talent_uuid", talentUuid)
        .single();

      if (error || !data || !data.display_name) return null;

      // For coins tab, return null if user doesn't have coins
      if (tab === "coins" && !data.zora_creator_coin_address) {
        return null;
      }

      // Calculate rank by counting higher scores with same filtering
      let rankQuery = supabase
        .from("base200_leaderboard")
        .select("talent_uuid", { count: "exact" })
        .eq("calculation_date", latestDate)
        .eq("basecamp_002_participant", true)
        .not("display_name", "is", null)
        .gt("base200_score", data.base200_score);

      // Add same filtering for rank calculation
      if (tab === "coins") {
        rankQuery = rankQuery.not("zora_creator_coin_address", "is", null);
      }

      const { count } = await rankQuery.order("base200_score", {
        ascending: false,
        nullsFirst: false,
      });

      return {
        ...data,
        rank: (count || 0) + 1,
      };
    },
    [CACHE_KEYS.LEADERBOARD + `-basecamp-user-rank-${tab}-${talentUuid}`],
    {
      revalidate: CACHE_DURATION_1_HOUR,
      tags: [CACHE_KEYS.LEADERBOARD + "-basecamp"],
    },
  )();
}

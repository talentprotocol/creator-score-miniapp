import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_1_HOUR } from "@/lib/cache-keys";

async function getLatestCalculationDate(): Promise<string> {
  const { data, error } = await supabase
    .from("base200_leaderboard")
    .select("calculation_date")
    .order("calculation_date", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    throw new Error("Failed to get latest calculation date");
  }

  return data[0].calculation_date;
}

export async function GET() {
  try {
    const result = await unstable_cache(
      async () => {
        const latestDate = await getLatestCalculationDate();

        // Get reputation total
        const { count: reputationCount } = await supabase
          .from("base200_leaderboard")
          .select("*", { count: "exact", head: true })
          .eq("calculation_date", latestDate)
          .eq("basecamp_002_participant", true)
          .not("display_name", "is", null);

        // Get coins total
        const { count: coinsCount } = await supabase
          .from("base200_leaderboard")
          .select("*", { count: "exact", head: true })
          .eq("calculation_date", latestDate)
          .eq("basecamp_002_participant", true)
          .not("display_name", "is", null)
          .not("zora_creator_coin_address", "is", null);

        return {
          reputationTotal: reputationCount || 0,
          coinsTotal: coinsCount || 0,
        };
      },
      [CACHE_KEYS.LEADERBOARD + "-basecamp-totals"],
      {
        revalidate: CACHE_DURATION_1_HOUR,
        tags: [CACHE_KEYS.LEADERBOARD + "-basecamp"],
      },
    )();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Basecamp totals API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tab totals" },
      { status: 500 },
    );
  }
}

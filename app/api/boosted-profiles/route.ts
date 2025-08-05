import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_1_HOUR } from "@/lib/cache-keys";
import { getBoostedProfilesData } from "@/app/services/leaderboardService";

export async function GET() {
  try {
    // Force cache refresh by adding timestamp to cache key
    const cacheKey = `${CACHE_KEYS.BOOSTED_PROFILES}-v2-${Math.floor(Date.now() / (1000 * 60 * 60))}`; // Change every hour

    const boostedProfiles = await unstable_cache(
      async () => {
        console.log(
          "🔄 [BOOSTED PROFILES API] Cache miss, fetching fresh data...",
        );
        return await getBoostedProfilesData();
      },
      [cacheKey],
      { revalidate: CACHE_DURATION_1_HOUR },
    )();

    console.log(
      `✅ [BOOSTED PROFILES API] Returning ${boostedProfiles.length} boosted profiles`,
    );
    return NextResponse.json({ profiles: boostedProfiles });
  } catch (error) {
    console.error("❌ [BOOSTED PROFILES API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch boosted profiles" },
      { status: 500 },
    );
  }
}

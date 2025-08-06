import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_10_MINUTES } from "@/lib/cache-keys";
import { getTop200LeaderboardEntries } from "@/app/services/leaderboardService";

export const maxDuration = 60;

export async function GET() {
  try {
    // Cache the entire processed response for top 200 entries
    const cachedResponse = unstable_cache(
      async () => {
        return await getTop200LeaderboardEntries();
      },
      [CACHE_KEYS.LEADERBOARD_BASIC],
      { revalidate: CACHE_DURATION_10_MINUTES },
    );

    const result = await cachedResponse();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch leaderboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 },
    );
  }
}

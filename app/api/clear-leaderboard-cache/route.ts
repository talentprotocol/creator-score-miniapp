import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CACHE_KEYS } from "@/lib/cache-keys";

/**
 * POST /api/clear-leaderboard-cache
 *
 * Clear all leaderboard-related cache to ensure fresh data
 * This is useful for fixing rewards decision display issues
 */
export async function POST() {
  try {
    // Clear leaderboard-related cache (user preferences are no longer cached)
    revalidateTag(CACHE_KEYS.LEADERBOARD);
    revalidateTag(CACHE_KEYS.LEADERBOARD_BASIC);
    revalidateTag(CACHE_KEYS.LEADERBOARD_TOP_200);
    revalidateTag(CACHE_KEYS.LEADERBOARD + "-snapshot-profiles");

    return NextResponse.json({
      success: true,
      message: "Leaderboard cache cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing leaderboard cache:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear leaderboard cache" },
      { status: 500 },
    );
  }
}

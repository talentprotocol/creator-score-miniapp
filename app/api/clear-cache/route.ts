import { NextRequest, NextResponse } from "next/server";
import { clearUserCache } from "@/lib/cache-keys";
import { revalidateTag } from "next/cache";
import { CACHE_KEYS } from "@/lib/cache-keys";

/**
 * POST /api/clear-cache
 *
 * Clear cache for a specific user's data
 * This fixes the Purple DAO credential display issue and similar cache problems
 */
export async function POST(req: NextRequest) {
  try {
    const { talent_uuid } = await req.json();

    if (!talent_uuid) {
      return NextResponse.json(
        { success: false, error: "Missing talent_uuid" },
        { status: 400 },
      );
    }

    // Clear both server-side and client-side cache for this user
    await clearUserCache(talent_uuid);

    // Also clear leaderboard cache to ensure fresh data
    revalidateTag(CACHE_KEYS.LEADERBOARD);
    revalidateTag(CACHE_KEYS.LEADERBOARD_BASIC);
    revalidateTag(CACHE_KEYS.LEADERBOARD_TOP_200);
    revalidateTag(CACHE_KEYS.LEADERBOARD + "-user-preferences");

    return NextResponse.json({
      success: true,
      message: `Cache cleared for user ${talent_uuid} and leaderboard`,
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cache" },
      { status: 500 },
    );
  }
}

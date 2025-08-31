import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CACHE_KEYS } from "@/lib/cache-keys";

/**
 * POST /api/admin/invalidate-leaderboard-cache
 *
 * Admin endpoint to manually invalidate leaderboard cache
 * Useful for testing and debugging cache issues
 */
export async function POST(req: NextRequest) {
  try {
    // Check for admin authorization (you can add your own auth logic here)
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Invalidate leaderboard-related caches (user preferences are no longer cached)
    revalidateTag(CACHE_KEYS.LEADERBOARD);
    revalidateTag(CACHE_KEYS.LEADERBOARD_BASIC);
    revalidateTag(CACHE_KEYS.LEADERBOARD_TOP_200);
    revalidateTag(CACHE_KEYS.LEADERBOARD + "-snapshot-profiles");

    console.log("[Admin] Manually invalidated all leaderboard caches");

    return NextResponse.json({
      success: true,
      message: "Leaderboard cache invalidated successfully",
      invalidatedTags: [
        CACHE_KEYS.LEADERBOARD,
        CACHE_KEYS.LEADERBOARD_BASIC,
        CACHE_KEYS.LEADERBOARD_TOP_200,
        CACHE_KEYS.LEADERBOARD + "-snapshot-profiles",
      ],
    });
  } catch (error) {
    console.error("Error invalidating leaderboard cache:", error);
    return NextResponse.json(
      { success: false, error: "Failed to invalidate cache" },
      { status: 500 },
    );
  }
}

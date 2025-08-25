import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CACHE_KEYS } from "@/lib/cache-keys";

/**
 * POST /api/badges/refresh
 *
 * Clears badge-specific caches after score verification.
 * Enables selective cache invalidation for better performance.
 *
 * Request Body:
 * {
 *   talentUUID: string,
 *   badgeSlug: string,
 *   cacheKeys: string[]
 * }
 *
 * Architecture:
 * - Follows coding principles by handling cache logic in API route
 * - Uses user-scoped cache tags for precise invalidation
 * - Maintains server-side cache management separation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { talentUUID, badgeSlug, cacheKeys } = body;

    // Validate required parameters
    if (!talentUUID) {
      return NextResponse.json(
        { error: "talentUUID is required" },
        { status: 400 },
      );
    }

    if (!badgeSlug) {
      return NextResponse.json(
        { error: "badgeSlug is required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(cacheKeys)) {
      return NextResponse.json(
        { error: "cacheKeys must be an array" },
        { status: 400 },
      );
    }

    // Build user-scoped cache tags to invalidate
    const tagsToInvalidate: string[] = [];

    // Always invalidate user's badge cache
    tagsToInvalidate.push(`${CACHE_KEYS.USER_BADGES}-${talentUUID}`);

    // Add badge-specific cache tags based on badge type
    for (const cacheKey of cacheKeys) {
      switch (cacheKey) {
        case "USER_CREATOR_SCORE":
          tagsToInvalidate.push(
            `${CACHE_KEYS.CREATOR_SCORES}-talent-${talentUUID}`,
          );
          tagsToInvalidate.push(CACHE_KEYS.CREATOR_SCORES);
          break;
        case "CREATOR_SCORES":
          tagsToInvalidate.push(CACHE_KEYS.CREATOR_SCORES);
          break;
        case "CREDENTIALS":
          tagsToInvalidate.push(`${CACHE_KEYS.CREDENTIALS}-${talentUUID}`);
          tagsToInvalidate.push(CACHE_KEYS.CREDENTIALS);
          break;
        case "TOTAL_EARNINGS":
          tagsToInvalidate.push(`${CACHE_KEYS.TOTAL_EARNINGS}-${talentUUID}`);
          break;
        case "PROFILE_SOCIAL_ACCOUNTS":
          tagsToInvalidate.push(
            `${CACHE_KEYS.PROFILE_SOCIAL_ACCOUNTS}-${talentUUID}`,
          );
          break;
        case "SOCIAL_ACCOUNTS":
          tagsToInvalidate.push(CACHE_KEYS.SOCIAL_ACCOUNTS);
          break;
        case "USER_TOKEN_BALANCE":
          tagsToInvalidate.push(
            `${CACHE_KEYS.USER_TOKEN_BALANCE}-${talentUUID}`,
          );
          break;
        case "DATA_POINTS_SUM":
          tagsToInvalidate.push(`${CACHE_KEYS.DATA_POINTS_SUM}-${talentUUID}`);
          break;
        default:
          // For unknown cache keys, try to invalidate user-scoped version
          tagsToInvalidate.push(`${cacheKey}-${talentUUID}`);
          break;
      }
    }

    // Remove duplicates
    const uniqueTags = Array.from(new Set(tagsToInvalidate));

    // Invalidate all relevant cache tags
    for (const tag of uniqueTags) {
      try {
        revalidateTag(tag);
      } catch (tagError) {
        console.warn(`Failed to invalidate cache tag: ${tag}`, tagError);
        // Continue with other tags even if one fails
      }
    }

    console.log(
      `[badges/refresh] Invalidated ${uniqueTags.length} cache tags for user ${talentUUID}, badge ${badgeSlug}`,
    );

    return NextResponse.json({
      success: true,
      message: "Badge caches cleared successfully",
      invalidatedTags: uniqueTags,
    });
  } catch (error) {
    console.error("[badges/refresh] Error:", error);
    return NextResponse.json(
      { error: "Failed to clear badge caches" },
      { status: 500 },
    );
  }
}

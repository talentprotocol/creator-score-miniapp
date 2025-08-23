// Removed unused imports - LEVEL_RANGES and getLevelFromScore not needed for Creator Score
import { CreatorScore, SCORER_SLUGS } from "./types";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";

/**
 * SERVER-SIDE ONLY: Internal function to get Creator Score for a Talent Protocol ID
 * This function should only be called from server-side code (layouts, API routes)
 */
async function getCreatorScoreForTalentIdInternal(
  talentId: string | number,
): Promise<CreatorScore> {
  try {
    const { talentApiClient } = await import("@/lib/talent-api-client");

    const params = {
      talent_protocol_id: String(talentId),
      scorer_slug: SCORER_SLUGS.CREATOR,
    };

    const response = await talentApiClient.getScore(params);
    const data = await response.json();

    if (data.error) {
      return {
        score: 0,
        level: 1,
        levelName: "Level 1",
        lastCalculatedAt: null,
        walletAddress: null,
        calculating: false,
        error: data.error,
      };
    }

    // Extract points and last_calculated_at from the nested score object
    const points = data.score?.points ?? 0;
    const lastCalculatedAt = data.score?.last_calculated_at ?? null;
    const calculating = data.score?.calculating_score ?? false;

    // Calculate level based on score
    const level = Math.floor(points / 1000) + 1;
    const levelName = `Level ${level}`;

    return {
      score: points,
      level,
      levelName,
      lastCalculatedAt,
      walletAddress: null,
      calculating,
    };
  } catch (error) {
    return {
      score: 0,
      level: 1,
      levelName: "Level 1",
      lastCalculatedAt: null,
      walletAddress: null,
      calculating: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch creator score",
    };
  }
}

/**
 * SERVER-SIDE ONLY: Cached version of getCreatorScoreForTalentId
 * This function should only be called from server-side code (layouts, API routes)
 *
 * ARCHITECTURE NOTE: This follows the coding principles by:
 * 1. Using Talent UUID as canonical identifier (not wallet addresses)
 * 2. Being server-side only (no client-side imports)
 * 3. Proper caching with unstable_cache
 */
export function getCreatorScoreForTalentId(talentId: string | number) {
  return unstable_cache(
    async () => getCreatorScoreForTalentIdInternal(talentId),
    [`${CACHE_KEYS.CREATOR_SCORES}-talent-${talentId}`],
    {
      tags: [
        `${CACHE_KEYS.CREATOR_SCORES}-talent-${talentId}`,
        CACHE_KEYS.CREATOR_SCORES,
      ],
      revalidate: CACHE_DURATION_5_MINUTES,
    },
  );
}

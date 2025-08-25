// Removed unused imports - LEVEL_RANGES and getLevelFromScore not needed for Creator Score
import { CreatorScore, SCORER_SLUGS } from "./types";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";
import { dlog, dtimer } from "@/lib/debug";

/**
 * SERVER-SIDE ONLY: Internal function to get Creator Score for a Talent Protocol ID
 * This function should only be called from server-side code (layouts, API routes)
 */
async function getCreatorScoreForTalentIdInternal(
  talentId: string | number,
): Promise<CreatorScore> {
  const internalTimer = dtimer("ScoresService", "getCreatorScoreInternal");

  dlog("ScoresService", "getCreatorScoreInternal_start", {
    talentId,
    talentId_type: typeof talentId,
  });

  try {
    const { talentApiClient } = await import("@/lib/talent-api-client");

    const params = {
      talent_protocol_id: String(talentId),
      scorer_slug: SCORER_SLUGS.CREATOR,
    };

    dlog("ScoresService", "getCreatorScoreInternal_params", {
      talentId,
      params,
    });

    const response = await talentApiClient.getScore(params);

    dlog("ScoresService", "getCreatorScoreInternal_response", {
      talentId,
      response_ok: response.ok,
      response_status: response.status,
    });

    const data = await response.json();

    dlog("ScoresService", "getCreatorScoreInternal_data", {
      talentId,
      has_error: !!data.error,
      error_message: data.error || null,
      has_score: !!data.score,
      has_scores: !!data.scores,
      scores_count: data.scores?.length || 0,
    });

    if (data.error) {
      dlog("ScoresService", "getCreatorScoreInternal_api_error", {
        talentId,
        error: data.error,
      });

      const result = {
        score: 0,
        level: 1,
        levelName: "Level 1",
        lastCalculatedAt: null,
        walletAddress: null,
        calculating: false,
        error: data.error,
      };

      internalTimer.end();
      return result;
    }

    // Extract points and last_calculated_at from the nested score object
    const points = data.score?.points ?? 0;
    const lastCalculatedAt = data.score?.last_calculated_at ?? null;
    const calculating = data.score?.calculating_score ?? false;

    // Calculate level based on score
    const level = Math.floor(points / 1000) + 1;
    const levelName = `Level ${level}`;

    const result = {
      score: points,
      level,
      levelName,
      lastCalculatedAt,
      walletAddress: null,
      calculating,
    };

    dlog("ScoresService", "getCreatorScoreInternal_success", {
      talentId,
      score: points,
      level,
      lastCalculatedAt,
      calculating,
    });

    internalTimer.end();
    return result;
  } catch (error) {
    dlog("ScoresService", "getCreatorScoreInternal_exception", {
      talentId,
      error: error instanceof Error ? error.message : String(error),
      error_type:
        error instanceof Error ? error.constructor.name : typeof error,
    });

    const result = {
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

    internalTimer.end();
    return result;
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

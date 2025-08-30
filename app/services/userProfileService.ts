import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";
import { TalentApiClient } from "@/lib/talent-api-client";
import type { UnifiedUserProfile } from "@/lib/types";

// Initialize the centralized API client
const talentApiClient = new TalentApiClient();

async function fetchCreatorScore(talentUuid: string): Promise<{
  points: number;
  lastCalculatedAt: string | null;
  calculating: boolean;
}> {
  try {
    const response = await talentApiClient.getScore({
      talent_protocol_id: talentUuid,
      scorer_slug: "creator_score",
    });

    if (!response.ok) {
      return { points: 0, lastCalculatedAt: null, calculating: false };
    }

    const data = await response.json();
    const score = data?.score || {};
    return {
      points: Number(score.points) || 0,
      lastCalculatedAt: score.last_calculated_at ?? null,
      calculating: Boolean(score.calculating_score) || false,
    };
  } catch {
    return { points: 0, lastCalculatedAt: null, calculating: false };
  }
}

async function fetchUnifiedProfile(
  talentUuid: string,
): Promise<UnifiedUserProfile> {
  try {
    const response = await talentApiClient.getProfile({
      talent_protocol_id: talentUuid,
    });

    if (!response.ok) {
      // Not found → return empty but consistent shape
      return {
        talentUuid,
        displayName: null,
        avatarUrl: null,
        creatorScore: 0,
        lastCalculatedAt: null,
        calculating: false,
        hasTalentAccount: false,
        error: `HTTP ${response.status}`,
      };
    }

    const profile = await response.json();
    if (!profile) {
      return {
        talentUuid,
        displayName: null,
        avatarUrl: null,
        creatorScore: 0,
        lastCalculatedAt: null,
        calculating: false,
        hasTalentAccount: false,
      };
    }

    // Fetch creator score explicitly (more reliable than relying on profile payload)
    const scoreData = await fetchCreatorScore(talentUuid);
    const creatorScore = scoreData.points;
    const lastCalculatedAt = scoreData.lastCalculatedAt;
    const calculating = scoreData.calculating;

    return {
      talentUuid: profile.id || talentUuid,
      displayName: profile.display_name || profile.name || null,
      avatarUrl: profile.image_url || null,
      creatorScore: creatorScore || 0,
      lastCalculatedAt,
      calculating: !!calculating,
      hasTalentAccount: true,
    };
  } catch (error) {
    // Handle any unexpected errors
    return {
      talentUuid,
      displayName: null,
      avatarUrl: null,
      creatorScore: 0,
      lastCalculatedAt: null,
      calculating: false,
      hasTalentAccount: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export const getUserProfile = unstable_cache(
  async (talentUuid: string): Promise<UnifiedUserProfile> => {
    if (!talentUuid) {
      return {
        talentUuid: null,
        displayName: null,
        avatarUrl: null,
        creatorScore: 0,
        lastCalculatedAt: null,
        calculating: false,
        hasTalentAccount: false,
        error: "Missing talentUuid",
      };
    }
    return fetchUnifiedProfile(talentUuid);
  },
  [CACHE_KEYS.USER_PROFILE],
  { revalidate: CACHE_DURATION_5_MINUTES, tags: [CACHE_KEYS.USER_PROFILE] },
);

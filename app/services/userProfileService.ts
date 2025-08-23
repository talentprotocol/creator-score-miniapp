import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";
import type { UnifiedUserProfile } from "./types";

const TALENT_API_BASE = "https://api.talentprotocol.com";

async function fetchCreatorScore(talentUuid: string): Promise<{
  points: number;
  lastCalculatedAt: string | null;
  calculating: boolean;
}> {
  const params = new URLSearchParams();
  params.append("id", talentUuid);
  params.append("scorer_slug", "creator_score");

  try {
    const res = await fetch(`${TALENT_API_BASE}/score?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "X-API-KEY": process.env.TALENT_API_KEY || "",
      },
    });

    if (!res.ok) {
      return { points: 0, lastCalculatedAt: null, calculating: false };
    }

    const data = await res.json();
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
  const params = new URLSearchParams();
  params.append("id", talentUuid);
  params.append("scorer_slug", "creator_score");

  const res = await fetch(`${TALENT_API_BASE}/profile?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "X-API-KEY": process.env.TALENT_API_KEY || "",
    },
  });

  if (!res.ok) {
    // Not found → return empty but consistent shape
    return {
      talentUuid,
      displayName: null,
      avatarUrl: null,
      creatorScore: 0,
      lastCalculatedAt: null,
      calculating: false,
      hasTalentAccount: false,
      error: `HTTP ${res.status}`,
    };
  }

  const data = await res.json();
  const profile = data?.profile;
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

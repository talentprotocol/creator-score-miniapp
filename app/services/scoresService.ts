import { LEVEL_RANGES } from "@/lib/constants";
import { BuilderScore, CreatorScore, SCORER_SLUGS } from "./types";

/**
 * Generic function to fetch a score for a single wallet address
 */
async function getScoreForAddress(
  address: string,
  scorerSlug: string = SCORER_SLUGS.BUILDER,
): Promise<BuilderScore> {
  try {
    // Use relative path for local development to avoid CORS issues
    let baseUrl = "";
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost") {
        baseUrl = ""; // relative path
      } else {
        baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
      }
    } else {
      baseUrl = process.env.NEXT_PUBLIC_URL || "";
    }
    const params = new URLSearchParams({ address });
    if (scorerSlug) params.append("scorer_slug", scorerSlug);
    params.append("account_source", "wallet");
    const response = await fetch(
      `${baseUrl}/api/talent-score?${params.toString()}`,
      { method: "GET" },
    );
    const data = await response.json();

    if (data.error) {
      return {
        score: 0,
        level: 1,
        levelName: "Level 1",
        lastCalculatedAt: null,
        walletAddress: null,
        error: data.error,
      };
    }

    // Extract points and last_calculated_at from the nested score object
    const points = data.score?.points ?? 0;
    const lastCalculatedAt = data.score?.last_calculated_at ?? null;

    const levelInfo =
      LEVEL_RANGES.find(
        (range) => points >= range.min && points <= range.max,
      ) || LEVEL_RANGES[0];
    const level = LEVEL_RANGES.indexOf(levelInfo) + 1;

    return {
      score: points,
      level,
      levelName: levelInfo.name,
      lastCalculatedAt,
      walletAddress: address,
    };
  } catch (error) {
    return {
      score: 0,
      level: 1,
      levelName: "Level 1",
      lastCalculatedAt: null,
      walletAddress: null,
      error: error instanceof Error ? error.message : "Failed to fetch score",
    };
  }
}

/**
 * Generic function to fetch the highest score from all wallet addresses
 */
async function getHighestScore(
  addresses: string[],
  scorerSlug: string = SCORER_SLUGS.BUILDER,
): Promise<BuilderScore> {
  if (!addresses.length) {
    return {
      score: 0,
      level: 1,
      levelName: "Level 1",
      lastCalculatedAt: null,
      walletAddress: null,
      error: "No wallet addresses provided",
    };
  }
  try {
    // Lowercase all addresses before querying
    const scores = await Promise.all(
      addresses.map((addr) =>
        getScoreForAddress(addr.toLowerCase(), scorerSlug),
      ),
    );
    // Filter out errors and find the highest score
    const validScores = scores.filter((s) => !s.error);
    if (validScores.length === 0) {
      return {
        score: 0,
        level: 1,
        levelName: "Level 1",
        lastCalculatedAt: null,
        walletAddress: null,
        error: "No valid scores found",
      };
    }
    // Return the score with the highest value
    return validScores.reduce((highest, current) =>
      current.score > highest.score ? current : highest,
    );
  } catch (error) {
    return {
      score: 0,
      level: 1,
      levelName: "Level 1",
      lastCalculatedAt: null,
      walletAddress: null,
      error: error instanceof Error ? error.message : "Failed to fetch scores",
    };
  }
}

/**
 * Fetches the highest Builder Score from all wallet addresses
 */
export async function getBuilderScore(
  addresses: string[],
  scorerSlug?: string,
): Promise<BuilderScore> {
  return getHighestScore(addresses, scorerSlug || SCORER_SLUGS.BUILDER);
}

/**
 * Fetches the highest Creator Score from all wallet addresses
 */
export async function getCreatorScore(
  addresses: string[],
  scorerSlug?: string,
): Promise<CreatorScore> {
  return getHighestScore(addresses, scorerSlug || SCORER_SLUGS.CREATOR);
}

/**
 * Fetches Creator Score for a Talent Protocol ID
 */
export async function getCreatorScoreForTalentId(
  talentId: string | number,
): Promise<CreatorScore> {
  try {
    let baseUrl = "";
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost") {
        baseUrl = ""; // relative path
      } else {
        baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
      }
    } else {
      baseUrl = process.env.NEXT_PUBLIC_URL || "";
    }
    const params = new URLSearchParams({
      talent_protocol_id: String(talentId),
      scorer_slug: SCORER_SLUGS.CREATOR,
    });
    const response = await fetch(
      `${baseUrl}/api/talent-score?${params.toString()}`,
      { method: "GET" },
    );
    const data = await response.json();
    if (data.error) {
      return {
        score: 0,
        level: 1,
        levelName: "Level 1",
        lastCalculatedAt: null,
        walletAddress: null,
        error: data.error,
      };
    }
    const points = data.score?.points ?? 0;
    const lastCalculatedAt = data.score?.last_calculated_at ?? null;
    const levelInfo =
      LEVEL_RANGES.find(
        (range) => points >= range.min && points <= range.max,
      ) || LEVEL_RANGES[0];
    const level = LEVEL_RANGES.indexOf(levelInfo) + 1;
    return {
      score: points,
      level,
      levelName: levelInfo.name,
      lastCalculatedAt,
      walletAddress: null,
    };
  } catch (error) {
    return {
      score: 0,
      level: 1,
      levelName: "Level 1",
      lastCalculatedAt: null,
      walletAddress: null,
      error: error instanceof Error ? error.message : "Failed to fetch score",
    };
  }
}

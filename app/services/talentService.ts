export interface BuilderScore {
  score: number;
  level: number;
  levelName: string;
  lastCalculatedAt: string | null;
  walletAddress: string | null;
  error?: string;
}

const LEVEL_RANGES = [
  { min: 0, max: 39, name: "Level 1" },
  { min: 40, max: 79, name: "Level 2" },
  { min: 80, max: 119, name: "Level 3" },
  { min: 120, max: 169, name: "Level 4" },
  { min: 170, max: 249, name: "Level 5" },
  { min: 250, max: Infinity, name: "Level 6" },
] as const;

/**
 * Fetches the Builder Score for a single wallet address via the local API route
 */
async function getBuilderScoreForAddress(
  address: string,
): Promise<BuilderScore> {
  try {
    const response = await fetch("/api/talent-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const data = await response.json();
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
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch Builder Score",
    };
  }
}

/**
 * Fetches the highest Builder Score from all wallet addresses
 * @param addresses Array of wallet addresses to check
 * @returns Promise<BuilderScore> Object containing the highest score found
 */
export async function getBuilderScore(
  addresses: string[],
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
    const scores = await Promise.all(
      addresses.map((addr) => getBuilderScoreForAddress(addr)),
    );
    const validScores = scores.filter((s) => !s.error);
    if (validScores.length === 0) {
      return {
        score: 0,
        level: 1,
        levelName: "Level 1",
        lastCalculatedAt: null,
        walletAddress: null,
        error: "No valid Builder Scores found",
      };
    }
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
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch Builder Scores",
    };
  }
}

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
 * Fetches the Builder Score for a single wallet address
 */
async function getBuilderScoreForAddress(
  address: string,
): Promise<BuilderScore> {
  if (!process.env.TALENT_API_KEY) {
    console.error("TALENT_API_KEY is not set in environment variables");
    return {
      score: 0,
      level: 1,
      levelName: "Level 1",
      lastCalculatedAt: null,
      walletAddress: null,
      error: "Server configuration error",
    };
  }

  try {
    const response = await fetch(`https://api.talentprotocol.com/v2/score`, {
      headers: {
        "X-API-KEY": process.env.TALENT_API_KEY,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        address,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        score: 0,
        level: 1,
        levelName: "Level 1",
        lastCalculatedAt: null,
        walletAddress: null,
        error: data.error || "Failed to fetch Builder Score",
      };
    }

    const score = data.score || 0;
    const lastCalculatedAt = data.last_calculated_at || null;

    // Find the appropriate level based on score
    const levelInfo =
      LEVEL_RANGES.find((range) => score >= range.min && score <= range.max) ||
      LEVEL_RANGES[0];

    const level = LEVEL_RANGES.indexOf(levelInfo) + 1;

    return {
      score,
      level,
      levelName: levelInfo.name,
      lastCalculatedAt,
      walletAddress: address,
    };
  } catch (error) {
    console.error("Error fetching Builder Score:", error);
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
    // Fetch scores for all addresses in parallel
    const scores = await Promise.all(
      addresses.map((addr) => getBuilderScoreForAddress(addr)),
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
        error: "No valid Builder Scores found",
      };
    }

    // Return the score with the highest value
    return validScores.reduce((highest, current) =>
      current.score > highest.score ? current : highest,
    );
  } catch (error) {
    console.error("Error fetching Builder Scores:", error);
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

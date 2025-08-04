import type { LeaderboardEntry } from "./types";

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  boostedCreatorsCount?: number;
  tokenDataAvailable?: boolean;
  lastUpdated?: string | null;
  nextUpdate?: string | null;
}

export async function getLeaderboardCreators(
  page: number = 1,
  perPage: number = 25,
): Promise<LeaderboardResponse> {
  const response = await fetch(
    `/api/leaderboard?page=${page}&per_page=${perPage}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard data");
  }

  const json = await response.json();
  return {
    entries: json.entries || [],
    boostedCreatorsCount: json.boostedCreatorsCount,
    tokenDataAvailable: json.tokenDataAvailable,
    lastUpdated: json.lastUpdated,
    nextUpdate: json.nextUpdate,
  };
}

/**
 * Fetches leaderboard stats (minScore and totalCreators with creator score > 0) from the API
 */
export async function getLeaderboardStats(): Promise<{
  minScore: number | null;
  totalCreators: number;
  eligibleCreators: number;
}> {
  const res = await fetch(`/api/leaderboard?statsOnly=true&page=1&per_page=1`);
  if (!res.ok) {
    throw new Error("Failed to fetch leaderboard stats");
  }
  const json = await res.json();
  return {
    minScore: json.minScore ?? null,
    totalCreators: json.totalCreators ?? 0,
    eligibleCreators: json.eligibleCreators ?? 0,
  };
}

import { LeaderboardEntry } from "./types";

/**
 * Fetches leaderboard data (top creators by Creator Score) from Talent Protocol API
 */
export async function getLeaderboardCreators({
  page = 1,
  perPage = 10,
}: { page?: number; perPage?: number } = {}): Promise<LeaderboardEntry[]> {
  const res = await fetch(`/api/leaderboard?page=${page}&perPage=${perPage}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to fetch leaderboard data");
  }
  const json = await res.json();
  return json.entries || [];
}

/**
 * Fetches leaderboard stats (minScore and totalCreators with creator score > 0) from the API
 */
export async function getLeaderboardStats(): Promise<{
  minScore: number | null;
  totalCreators: number;
}> {
  const res = await fetch(`/api/leaderboard?statsOnly=true&page=1&per_page=1`);
  if (!res.ok) {
    throw new Error("Failed to fetch leaderboard stats");
  }
  const json = await res.json();
  return {
    minScore: json.minScore ?? null,
    totalCreators: json.totalCreators ?? 0,
  };
}

import type { LeaderboardEntry } from "./types";
import { BOOST_CONFIG } from "@/lib/constants";

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  boostedCreatorsCount?: number;
  lastUpdated?: string | null;
  nextUpdate?: string | null;
}

export async function getLeaderboardCreators(
  page: number = 1,
  perPage: number = 200,
): Promise<LeaderboardResponse> {
  const response = await fetch(
    `/api/leaderboard/basic?page=${page}&per_page=${perPage}`,
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
    lastUpdated: json.lastUpdated,
    nextUpdate: json.nextUpdate,
  };
}

/**
 * Internal helper to execute a single search query
 */
async function executeSearchQuery(
  baseUrl: string,
  searchQuery: Record<string, unknown>,
  apiKey: string,
  queryName: string,
): Promise<string[]> {
  const queryString = Object.keys(searchQuery)
    .map(
      (key) => `${key}=${encodeURIComponent(JSON.stringify(searchQuery[key]))}`,
    )
    .join("&");

  const response = await fetch(
    `${baseUrl}/search/advanced/profiles?${queryString}`,
    {
      headers: {
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${queryName} search failed: ${errorText}`);
  }

  const data = await response.json();
  const profileIds =
    data.profiles?.map((profile: { id: string }) => profile.id) || [];

  return profileIds;
}

/**
 * Internal helper to get boosted profiles from external API using OR logic
 * Returns profiles that have EITHER talent_protocol_talent_holder ≥ 100 OR talent_vault ≥ 100
 */
async function getBoostedProfilesViaSearch(apiKey: string): Promise<string[]> {
  const baseUrl = "https://api.talentprotocol.com";
  const boostedProfileIds = new Set<string>();

  // Query 1: talent_protocol_talent_holder ≥ 100 (optimized for top 200)
  const query1 = {
    query: {
      score: {
        min: 120, // Optimized: focus on profiles likely to be in top 200
        scorer: "Creator Score",
      },
      credentials: [
        {
          slug: "talent_protocol_talent_holder",
          valueRange: { min: BOOST_CONFIG.TOKEN_THRESHOLD },
        },
      ],
    },
    sort: {
      score: { order: "desc", scorer: "Creator Score" },
      id: { order: "desc" },
    },
    per_page: 200,
  };

  // Query 2: talent_vault ≥ 100 (optimized for top 200)
  const query2 = {
    query: {
      score: {
        min: 120, // Optimized: focus on profiles likely to be in top 200
        scorer: "Creator Score",
      },
      credentials: [
        {
          slug: "talent_vault",
          valueRange: { min: BOOST_CONFIG.TOKEN_THRESHOLD },
        },
      ],
    },
    sort: {
      score: { order: "desc", scorer: "Creator Score" },
      id: { order: "desc" },
    },
    per_page: 200,
  };

  // Execute both queries in parallel and handle partial failures gracefully
  const [results1, results2] = await Promise.allSettled([
    executeSearchQuery(
      baseUrl,
      query1,
      apiKey,
      "talent_protocol_talent_holder",
    ),
    executeSearchQuery(baseUrl, query2, apiKey, "talent_vault"),
  ]);

  // Process results and deduplicate
  if (results1.status === "fulfilled") {
    results1.value.forEach((id) => boostedProfileIds.add(id));
  }

  if (results2.status === "fulfilled") {
    results2.value.forEach((id) => boostedProfileIds.add(id));
  }

  const finalResults = Array.from(boostedProfileIds);
  return finalResults;
}

/**
 * Service function to get boosted profiles - called by API route
 */
export async function getBoostedProfilesData(): Promise<string[]> {
  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Talent API key");
  }

  const boostedProfileIds = await getBoostedProfilesViaSearch(apiKey);

  return boostedProfileIds;
}

/**
 * Get boosted profiles via API route - called by hooks
 */
export async function getBoostedProfiles(): Promise<string[]> {
  const response = await fetch("/api/boosted-profiles");

  if (!response.ok) {
    throw new Error("Failed to fetch boosted profiles");
  }

  const data = await response.json();
  return data.profiles || [];
}

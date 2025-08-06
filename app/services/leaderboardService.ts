import type { LeaderboardEntry } from "./types";
import { BOOST_CONFIG, PROJECT_ACCOUNTS_TO_EXCLUDE } from "@/lib/constants";

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  boostedCreatorsCount?: number;
  lastUpdated?: string | null;
  nextUpdate?: string | null;
}

type Profile = {
  id: string;
  display_name?: string;
  name?: string;
  image_url?: string;
  scores?: Array<{
    slug: string;
    points?: number;
  }>;
};

/**
 * Fetch top 200 entries from Talent Protocol API
 */
export async function fetchTop200Entries(apiKey: string): Promise<Profile[]> {
  const baseUrl = "https://api.talentprotocol.com/search/advanced/profiles";
  const batchSize = 200 + PROJECT_ACCOUNTS_TO_EXCLUDE.length;
  const totalNeeded = 200 + PROJECT_ACCOUNTS_TO_EXCLUDE.length;
  let allProfiles: Profile[] = [];

  for (let page = 1; allProfiles.length < totalNeeded; page++) {
    const data = {
      query: {
        score: {
          min: 1,
          scorer: "Creator Score",
        },
      },
      sort: {
        score: { order: "desc", scorer: "Creator Score" },
        id: { order: "desc" },
      },
      page,
      per_page: batchSize,
    };

    const queryString = [
      `query=${encodeURIComponent(JSON.stringify(data.query))}`,
      `sort=${encodeURIComponent(JSON.stringify(data.sort))}`,
      `page=${page}`,
      `per_page=${batchSize}`,
      `view=scores_minimal`,
    ].join("&");

    const res = await fetch(`${baseUrl}?${queryString}`, {
      headers: {
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch page ${page}: ${errorText}`);
    }

    const json = await res.json();
    const profiles = json.profiles || [];
    allProfiles = [...allProfiles, ...profiles];

    if (profiles.length < batchSize) break;

    if (page < Math.ceil(totalNeeded / batchSize)) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return allProfiles.slice(0, totalNeeded);
}

/**
 * Get top 200 leaderboard entries with boosted profiles integration
 */
export async function getTop200LeaderboardEntries(): Promise<LeaderboardResponse> {
  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Talent API key");
  }

  // Fetch profiles
  const profiles = await fetchTop200Entries(apiKey);

  // Filter out project accounts
  const filteredProfiles = profiles.filter(
    (profile) => !PROJECT_ACCOUNTS_TO_EXCLUDE.includes(profile.id),
  );

  // Fetch boosted profiles for integration
  let boostedProfileIds: string[] = [];
  try {
    boostedProfileIds = await getBoostedProfilesData();
  } catch {
    boostedProfileIds = [];
  }

  // Map to basic entries (no rewards) with boosted status
  const mapped = filteredProfiles.map((profile: Profile) => {
    const creatorScores = Array.isArray(profile.scores)
      ? profile.scores
          .filter((s) => s.slug === "creator_score")
          .map((s) => s.points ?? 0)
      : [];
    const score = creatorScores.length > 0 ? Math.max(...creatorScores) : 0;
    const isBoosted = boostedProfileIds.includes(profile.id);

    return {
      name: profile.display_name || profile.name || "Unknown",
      pfp: profile.image_url || undefined,
      score,
      id: profile.id,
      talent_protocol_id: profile.id,
      isBoosted,
    };
  });

  // Sort by score and assign ranks
  mapped.sort((a, b) => b.score - a.score);

  let lastScore: number | null = null;
  let lastRank = 0;
  let ties = 0;
  const ranked = mapped.map((entry, idx) => {
    let rank;
    if (entry.score === lastScore) {
      rank = lastRank;
      ties++;
    } else {
      rank = idx + 1;
      if (ties > 0) rank = lastRank + ties;
      lastScore = entry.score;
      lastRank = rank;
      ties = 1;
    }
    return { ...entry, rank };
  });

  // Count boosted creators
  const boostedCreatorsCount = ranked.filter((entry) => entry.isBoosted).length;

  return {
    entries: ranked,
    boostedCreatorsCount,
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

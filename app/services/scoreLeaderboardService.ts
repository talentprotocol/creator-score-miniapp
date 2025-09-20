import type { LeaderboardResponse } from "@/lib/types";
import { BOOST_CONFIG, PROJECT_ACCOUNTS_TO_EXCLUDE } from "@/lib/constants";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_1_HOUR } from "@/lib/cache-keys";
import { LeaderboardSnapshotService } from "./leaderboardSnapshotService";

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
export async function fetchTop200Entries(): Promise<Profile[]> {
  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Talent API key");
  }

  const profiles = await unstable_cache(
    async () => {
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
    },
    [CACHE_KEYS.LEADERBOARD_TOP_200],
    {
      revalidate: CACHE_DURATION_1_HOUR,
      tags: [CACHE_KEYS.LEADERBOARD_TOP_200],
    },
  )();

  return profiles;
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
  const profiles = await fetchTop200Entries();

  // Filter out project accounts
  const filteredProfiles = profiles.filter(
    (profile) => !PROJECT_ACCOUNTS_TO_EXCLUDE.includes(profile.id),
  );

  // Fetch opt-out status from leaderboard_snapshots (single source of truth)
  let snapshotMap = new Map<
    string,
    { opt_out: boolean | null; rewards_amount: number; rank: number }
  >();
  try {
    const snapshotExists = await LeaderboardSnapshotService.snapshotExists();
    if (snapshotExists) {
      const snapshots = await LeaderboardSnapshotService.getSnapshot();
      if (snapshots && snapshots.length > 0) {
        snapshotMap = new Map(
          snapshots.map((snapshot) => [
            snapshot.talent_uuid,
            {
              opt_out: snapshot.opt_out,
              rewards_amount: snapshot.rewards_amount,
              rank: snapshot.rank,
            },
          ]),
        );
      }
    }
  } catch (error) {
    console.error("Error fetching leaderboard snapshots:", error);
    snapshotMap = new Map();
  }

  // Map to basic entries with opt-out status (boost logic removed for now)
  const mapped = filteredProfiles.map((profile: Profile) => {
    const creatorScores = Array.isArray(profile.scores)
      ? profile.scores
          .filter((s) => s.slug === "creator_score")
          .map((s) => s.points ?? 0)
      : [];
    const score = creatorScores.length > 0 ? Math.max(...creatorScores) : 0;

    // Get snapshot data for this profile
    const snapshot = snapshotMap.get(profile.id);

    // Use opt_out status from snapshot data
    const isOptedOut = snapshot?.opt_out === true;
    const isOptedIn = snapshot?.opt_out === false;
    const isUndecided = snapshot?.opt_out === null; // NULL means no decision made

    return {
      name: profile.display_name || profile.name || "Unknown",
      pfp: profile.image_url || undefined,
      score,
      id: profile.id,
      talent_protocol_id: profile.id,
      isBoosted: false, // Boost logic removed for now - will be restored for token holder leaderboard
      isOptedOut,
      isOptedIn,
      isUndecided,
      baseReward: snapshot?.rewards_amount || 0,
      boostedReward: snapshot?.rewards_amount || 0,
      rank: snapshot?.rank || -1, // Use snapshot rank, -1 if not found
    };
  });

  return {
    entries: mapped,
  };
}

/**
 * Internal helper to execute a single search query
 */
async function executeSearchQuery(
  baseUrl: string,
  searchQuery: Record<string, unknown>,
  queryName: string,
): Promise<string[]> {
  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Talent API key");
  }

  const queryString = Object.keys(searchQuery)
    .map(
      (key) => `${key}=${encodeURIComponent(JSON.stringify(searchQuery[key]))}`,
    )
    .join("&");

  const profileIds = await unstable_cache(
    async () => {
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
    },
    [`${CACHE_KEYS.BOOSTED_PROFILES}-${queryName}-${queryString}`],
    { revalidate: CACHE_DURATION_1_HOUR },
  )();

  return profileIds;
}

/**
 * Internal helper to get boosted profiles from external API using OR logic
 * Returns profiles that have EITHER talent_protocol_talent_holder ≥ 100 OR talent_vault ≥ 100
 */
async function getBoostedProfilesViaSearch(): Promise<string[]> {
  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Talent API key");
  }

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
    executeSearchQuery(baseUrl, query1, "talent_protocol_talent_holder"),
    executeSearchQuery(baseUrl, query2, "talent_vault"),
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
  const boostedProfiles = await unstable_cache(
    async () => {
      return await getBoostedProfilesViaSearch();
    },
    [CACHE_KEYS.BOOSTED_PROFILES],
    { revalidate: CACHE_DURATION_1_HOUR, tags: [CACHE_KEYS.LEADERBOARD_BASIC] },
  )();

  return boostedProfiles;
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

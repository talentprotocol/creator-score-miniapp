import type { LeaderboardEntry } from "@/lib/types";
import { PROJECT_ACCOUNTS_TO_EXCLUDE } from "@/lib/constants";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_1_HOUR } from "@/lib/cache-keys";
import { LeaderboardSnapshotService } from "./leaderboardSnapshotService";
import { supabase } from "@/lib/supabase-client";

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
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
 * NEW IMPLEMENTATION: Get leaderboard entries using snapshot UUIDs
 * This approach queries Talent API for specific UUIDs from our frozen snapshot
 * instead of getting current top 200 by Creator Score
 */
export async function getTop200LeaderboardEntries(): Promise<LeaderboardResponse> {
  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Talent API key");
  }

  // Step 1: Get snapshot data (frozen ranks and rewards)
  const snapshotExists = await LeaderboardSnapshotService.snapshotExists();
  if (!snapshotExists) {
    console.log("[LeaderboardService] No snapshot exists, returning empty");
    return { entries: [] };
  }

  const snapshots = await LeaderboardSnapshotService.getSnapshot();
  if (!snapshots || snapshots.length === 0) {
    console.log("[LeaderboardService] Snapshot is empty, returning empty");
    return { entries: [] };
  }

  console.log(
    `[LeaderboardService] Found ${snapshots.length} snapshot entries`,
  );

  // Step 2: Extract UUIDs from snapshot
  const snapshotUUIDs = snapshots.map((s) => s.talent_uuid);
  console.log(
    `[LeaderboardService] Querying Talent API for ${snapshotUUIDs.length} specific UUIDs`,
  );

  // Step 3: Query Talent API for specific profiles by UUID
  const profiles = await unstable_cache(
    async () => {
      const baseUrl = "https://api.talentprotocol.com/search/advanced/profiles";
      const batchSize = 50; // Process in smaller batches
      const allProfiles: Profile[] = [];

      // Process UUIDs in batches
      for (let i = 0; i < snapshotUUIDs.length; i += batchSize) {
        const batch = snapshotUUIDs.slice(i, i + batchSize);

        const data = {
          query: {
            profileIds: batch,
            exactMatch: true,
          },
          sort: {
            id: { order: "desc" },
          },
          per_page: batchSize,
          view: "scores_minimal",
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
          throw new Error(
            `Failed to fetch batch ${Math.floor(i / batchSize) + 1}: ${errorText}`,
          );
        }

        const json = await res.json();
        const batchProfiles = json.profiles || [];
        allProfiles.push(...batchProfiles);

        // Rate limiting
        if (i + batchSize < snapshotUUIDs.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      return allProfiles;
    },
    [CACHE_KEYS.LEADERBOARD + "-snapshot-profiles"],
    {
      revalidate: CACHE_DURATION_1_HOUR,
      tags: [CACHE_KEYS.LEADERBOARD + "-snapshot-profiles"],
    },
  )();

  console.log(
    `[LeaderboardService] Retrieved ${profiles.length} profiles from Talent API`,
  );

  // Step 4: Filter out project accounts
  const filteredProfiles = profiles.filter(
    (profile) => !PROJECT_ACCOUNTS_TO_EXCLUDE.includes(profile.id),
  );

  // Step 5: Fetch opt-out status for all users (no caching for accuracy)
  let optedOutUserIds: string[] = [];
  let optedInUserIds: string[] = [];
  let undecidedUserIds: string[] = [];
  try {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("talent_uuid, rewards_decision");

    if (error) {
      console.error("Error fetching user preferences:", error);
    } else {
      optedOutUserIds =
        data
          ?.filter((row) => row.rewards_decision === "opted_out")
          .map((row) => row.talent_uuid) ?? [];
      optedInUserIds =
        data
          ?.filter((row) => row.rewards_decision === "opted_in")
          .map((row) => row.talent_uuid) ?? [];
      undecidedUserIds =
        data
          ?.filter((row) => row.rewards_decision === null)
          .map((row) => row.talent_uuid) ?? [];
    }
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    // Continue with empty arrays
  }

  // Debug: Log the counts for verification
  console.log(`[LeaderboardService] User preferences summary:`, {
    optedOut: optedOutUserIds.length,
    optedIn: optedInUserIds.length,
    undecided: undecidedUserIds.length,
    total:
      optedOutUserIds.length + optedInUserIds.length + undecidedUserIds.length,
  });

  // Step 6: Create snapshot map for quick lookup
  const snapshotMap = new Map(
    snapshots.map((snapshot) => [snapshot.talent_uuid, snapshot]),
  );

  // Step 7: Map profiles to leaderboard entries with snapshot data
  const mapped = filteredProfiles.map((profile: Profile) => {
    const creatorScores = Array.isArray(profile.scores)
      ? profile.scores
          .filter((s) => s.slug === "creator_score")
          .map((s) => s.points ?? 0)
      : [];
    const score = creatorScores.length > 0 ? Math.max(...creatorScores) : 0;

    const isOptedOut = optedOutUserIds.includes(profile.id);
    const isOptedIn = optedInUserIds.includes(profile.id);
    const isUndecided =
      undecidedUserIds.includes(profile.id) ||
      (!optedOutUserIds.includes(profile.id) &&
        !optedInUserIds.includes(profile.id) &&
        !undecidedUserIds.includes(profile.id));

    // Get snapshot data for this profile
    const snapshot = snapshotMap.get(profile.id);

    // Debug: Log specific users mentioned in the issue
    const debugUsers = [
      "98934280-2b20-4bfe-8bb8-54a270fd2a8a",
      "b56917e7-e37a-4d6c-a447-8bdc896163ba",
      "2465b21f-0d6b-4a2a-9869-93aafa1ed8db",
    ];
    if (debugUsers.includes(profile.id)) {
      console.log(
        `[LeaderboardService] Final mapping for ${profile.id} (${profile.display_name || profile.name}):`,
        {
          isOptedOut,
          isOptedIn,
          isUndecided,
          rank: snapshot?.rank || -1,
          reward: snapshot?.rewards_amount || 0,
        },
      );
    }

    return {
      name: profile.display_name || profile.name || "Unknown",
      pfp: profile.image_url || undefined,
      score,
      id: profile.id,
      talent_protocol_id: profile.id,
      isBoosted: false,
      isOptedOut,
      isOptedIn,
      isUndecided,
      baseReward: snapshot?.rewards_amount || 0,
      boostedReward: snapshot?.rewards_amount || 0,
      rank: snapshot?.rank || -1, // Use snapshot rank, -1 if not found
    };
  });

  // Step 8: Sort by snapshot rank to maintain frozen order
  const sorted = mapped.sort((a, b) => {
    if (a.rank === -1 && b.rank === -1) return 0;
    if (a.rank === -1) return 1;
    if (b.rank === -1) return -1;
    return a.rank - b.rank;
  });

  console.log(
    `[LeaderboardService] Returning ${sorted.length} entries sorted by snapshot rank`,
  );

  return {
    entries: sorted,
  };
}

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
          valueRange: { min: 100 }, // Changed to 100 for boosted profiles
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
          valueRange: { min: 100 }, // Changed to 100 for boosted profiles
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

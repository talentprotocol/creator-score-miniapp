import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_10_MINUTES } from "@/lib/cache-keys";
import {
  PROJECT_ACCOUNTS_TO_EXCLUDE,
  TOTAL_SPONSORS_POOL,
} from "@/lib/constants";
import { getCachedTokenBalances } from "../../services/tokenBalanceService";
import type { TokenBalanceData } from "../../services/tokenBalanceService";

type Profile = {
  id: string;
  display_name?: string;
  name?: string;
  image_url?: string;
  scores?: Array<{
    slug: string;
    points?: number;
    points_calculation_logic?: {
      data_points?: Array<{
        is_maximum: boolean;
        readable_value: string | null;
        value: string | null;
        uom: string | null;
      }>;
      max_points: number | null;
    };
  }>;
};

async function fetchTop200Entries(apiKey: string): Promise<Profile[]> {
  const baseUrl = "https://api.talentprotocol.com/search/advanced/profiles";
  const batchSize = 200 + PROJECT_ACCOUNTS_TO_EXCLUDE.length; // API limit
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
      console.error(`API Error for page ${page}:`, errorText);
      throw new Error(`Failed to fetch page ${page}: ${errorText}`);
    }

    const json = await res.json();
    const profiles = json.profiles || [];
    allProfiles = [...allProfiles, ...profiles];

    // Break if we got fewer results than requested (means we hit the end)
    if (profiles.length < batchSize) break;

    // Add a small delay between requests to be nice to the API
    if (page < Math.ceil(totalNeeded / batchSize)) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return allProfiles.slice(0, totalNeeded);
}

// initial load can take up to 60 seconds
export const maxDuration = 60;
export async function GET(req: NextRequest) {
  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing Talent API key" },
      { status: 500 },
    );
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const perPage = parseInt(
    searchParams.get("per_page") || searchParams.get("perPage") || "25",
    10,
  );
  const statsOnly = searchParams.get("statsOnly") === "true";

  // For stats-only request, we only need the first page and just a single result to get min score
  if (statsOnly) {
    try {
      const cachedStatsResponse = unstable_cache(
        async () => {
          const result = await fetch(
            `https://api.talentprotocol.com/search/advanced/profiles?page=1&per_page=1&scorer=creator_score&min_score=1`,
            {
              headers: {
                Accept: "application/json",
                "X-API-KEY": apiKey,
              },
            },
          );

          if (!result.ok) {
            const errorText = await result.text();
            console.error("API Error for stats:", errorText);
            throw new Error(errorText);
          }

          const json = await result.json();
          return {
            totalCreators: json.pagination?.total || 0,
            eligibleCreators: json.pagination?.total || 0,
            minScore:
              json.profiles?.[0]?.scores?.find(
                (s: { slug: string; points?: number }) =>
                  s.slug === "creator_score",
              )?.points || 0,
          };
        },
        [CACHE_KEYS.LEADERBOARD_STATS_ONLY], // Cache key
        { revalidate: CACHE_DURATION_10_MINUTES }, // Revalidate every 10 minutes
      );

      const statsData = await cachedStatsResponse();
      return NextResponse.json(statsData);
    } catch (error) {
      console.error("API error:", error);
      // Revalidate cache on error
      revalidateTag(CACHE_KEYS.LEADERBOARD_STATS_ONLY);
      return NextResponse.json(
        { error: "Failed to fetch leaderboard stats" },
        { status: 500 },
      );
    }
  }

  // For regular requests or if cache miss
  try {
    let profiles: Profile[];

    if (page === 1 && perPage === 200) {
      // Fetch all 200 entries in batches
      const cachedProfilesResponse = unstable_cache(
        async () => {
          return await fetchTop200Entries(apiKey);
        },
        [CACHE_KEYS.LEADERBOARD_TOP_200], // Cache key
        { revalidate: CACHE_DURATION_10_MINUTES }, // Revalidate every 10 minutes
      );
      profiles = await cachedProfilesResponse();

      if (profiles.length !== 200) {
        // if we find an error, we need to revalidate the cache so we can try again
        revalidateTag(CACHE_KEYS.LEADERBOARD_TOP_200);
      }
    } else {
      // Regular paginated request
      // if you update this, you need to update the cache key, right now only perPage and page are used
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
        per_page: perPage,
      };

      const queryString = [
        `query=${encodeURIComponent(JSON.stringify(data.query))}`,
        `sort=${encodeURIComponent(JSON.stringify(data.sort))}`,
        `page=${page}`,
        `per_page=${perPage}`,
        `view=scores_minimal`,
      ].join("&");

      const cachedTop10Response = unstable_cache(
        async () => {
          const result = await fetch(
            `https://api.talentprotocol.com/search/advanced/profiles?${queryString}`,
            {
              headers: {
                Accept: "application/json",
                "X-API-KEY": apiKey,
              },
            },
          );

          if (!result.ok) {
            const errorText = await result.text();
            console.error("API Error for paginated request:", errorText);
            throw new Error(errorText);
          }

          const json = await result.json();
          return json.profiles || [];
        },
        [`${CACHE_KEYS.PROFILE_SEARCH}-${queryString}`], // Cache key
        { revalidate: CACHE_DURATION_10_MINUTES }, // Revalidate every 10 minutes
      );

      profiles = await cachedTop10Response();
    }

    // Filter out project accounts
    profiles = profiles.filter(
      (profile) => !PROJECT_ACCOUNTS_TO_EXCLUDE.includes(profile.id),
    );

    // APPROACH 2: Try to get cached token balances with timeout (non-blocking)
    let cachedTokenBalances: {
      tokenBalances: Record<string, TokenBalanceData>;
      lastUpdated: string;
      nextUpdate: string;
    } | null = null;

    try {
      // Set a short timeout to avoid blocking the response
      const cachePromise = getCachedTokenBalances(apiKey);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Cache timeout")), 2000),
      );

      cachedTokenBalances = (await Promise.race([
        cachePromise,
        timeoutPromise,
      ])) as {
        tokenBalances: Record<string, TokenBalanceData>;
        lastUpdated: string;
        nextUpdate: string;
      };
      console.log("✅ Token balance cache hit - using cached data");
    } catch (error) {
      console.warn("Token balance cache miss or timeout:", error);
      cachedTokenBalances = null;
    }

    // Map and rank the entries
    const mapped = await Promise.all(
      profiles.map(async (profile: Profile) => {
        const p = profile;
        const creatorScores = Array.isArray(p.scores)
          ? p.scores
              .filter((s) => s.slug === "creator_score")
              .map((s) => s.points ?? 0)
          : [];
        const score = creatorScores.length > 0 ? Math.max(...creatorScores) : 0;

        // Get token balance from cached data (or default to 0 if cache miss)
        const tokenData = cachedTokenBalances?.tokenBalances[p.id];
        const tokenBalance = tokenData?.balance || 0;
        const isBoosted = tokenData?.isBoosted || false;
        const boostMultiplier = isBoosted ? 1.1 : 1.0;
        const boostedScore = score * boostMultiplier;

        // Calculate reward amounts (using existing logic from leaderboard page)
        const totalTop200Scores = profiles.reduce((sum, p) => {
          const scores = Array.isArray(p.scores)
            ? p.scores
                .filter((s) => s.slug === "creator_score")
                .map((s) => s.points ?? 0)
            : [];
          return sum + (scores.length > 0 ? Math.max(...scores) : 0);
        }, 0);

        const multiplier =
          totalTop200Scores > 0 ? TOTAL_SPONSORS_POOL / totalTop200Scores : 0;
        const baseReward = score * multiplier;
        const boostedReward = boostedScore * multiplier;
        const boostAmount = boostedReward - baseReward;

        return {
          name: p.display_name || p.name || "Unknown",
          pfp: p.image_url || undefined,
          score,
          id: p.id,
          talent_protocol_id: p.id,
          tokenBalance,
          isBoosted,
          boostAmount,
          baseReward,
          boostedReward,
        };
      }),
    );

    // Sort by score
    mapped.sort(
      (a: (typeof mapped)[0], b: (typeof mapped)[0]) => b.score - a.score,
    );

    // Assign ranks
    let lastScore: number | null = null;
    let lastRank = 0;
    let ties = 0;
    const ranked = mapped.map((entry: (typeof mapped)[0], idx: number) => {
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
      return {
        ...entry,
        rank,
      };
    });

    // Calculate boosted creators count for tab badge
    const boostedCreatorsCount = ranked.filter(
      (entry) => entry.isBoosted && entry.score > 0,
    ).length;

    // Start background cache refresh if cache was empty (fire and forget)
    if (!cachedTokenBalances && page === 1 && perPage === 200) {
      console.log("🔄 Starting background token balance cache refresh...");
      getCachedTokenBalances(apiKey).catch((error) => {
        console.warn("Background token balance fetch failed:", error);
      });
    }

    return NextResponse.json({
      entries: ranked,
      boostedCreatorsCount,
      tokenDataAvailable: !!cachedTokenBalances,
      lastUpdated: cachedTokenBalances?.lastUpdated || null,
      nextUpdate: cachedTokenBalances?.nextUpdate || null,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 },
    );
  }
}

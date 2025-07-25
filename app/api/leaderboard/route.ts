import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_10_MINUTES } from "@/lib/cache-keys";
import { PROJECT_ACCOUNTS_TO_EXCLUDE } from "@/lib/constants";

type Profile = {
  id: string;
  display_name?: string;
  name?: string;
  image_url?: string;
  scores?: Array<{ slug: string; points?: number }>;
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
      throw new Error(`Failed to fetch page ${page}`);
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
            throw new Error(await result.text());
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
        per_page: perPage + PROJECT_ACCOUNTS_TO_EXCLUDE.length,
      };

      const queryString = [
        `query=${encodeURIComponent(JSON.stringify(data.query))}`,
        `sort=${encodeURIComponent(JSON.stringify(data.sort))}`,
        `page=${page}`,
        `per_page=${perPage + PROJECT_ACCOUNTS_TO_EXCLUDE.length}`,
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
            throw new Error(await result.text());
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

    // Map and rank the entries
    const mapped = profiles.map((profile: Profile) => {
      const p = profile;
      const creatorScores = Array.isArray(p.scores)
        ? p.scores
            .filter((s) => s.slug === "creator_score")
            .map((s) => s.points ?? 0)
        : [];
      const score = creatorScores.length > 0 ? Math.max(...creatorScores) : 0;
      return {
        name: p.display_name || p.name || "Unknown",
        pfp: p.image_url || undefined,
        score,
        id: p.id,
        talent_protocol_id: p.id,
      };
    });

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

    return NextResponse.json({ entries: ranked });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 },
    );
  }
}

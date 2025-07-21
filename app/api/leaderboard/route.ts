import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

type Profile = {
  id: string;
  display_name?: string;
  name?: string;
  image_url?: string;
  scores?: Array<{ slug: string; points?: number }>;
};

// Cache keys
const CACHE_KEYS = {
  TOP_200: "cache:leaderboard:top_200",
  TOP_200_TOTAL_SCORES: "cache:leaderboard:top_200_total_scores",
} as const;

// Cache duration
const CACHE_DURATION = 3600; // 1 hour in seconds

async function fetchTop200Entries(apiKey: string): Promise<Profile[]> {
  const baseUrl = "https://api.talentprotocol.com/search/advanced/profiles";
  const batchSize = 25; // API limit
  const totalNeeded = 200;
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

  // For stats-only request, we only need the first page to get min score
  if (statsOnly) {
    try {
      const res = await fetch(
        `https://api.talentprotocol.com/search/advanced/profiles?page=1&per_page=1&scorer=creator_score&min_score=1`,
        {
          headers: {
            Accept: "application/json",
            "X-API-KEY": apiKey,
          },
        },
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const json = await res.json();
      const totalCreators = json.pagination?.total || 0;
      const eligibleCreators = json.pagination?.total || 0;
      const minScore =
        json.profiles?.[0]?.scores?.find(
          (s: { slug: string; points?: number }) => s.slug === "creator_score",
        )?.points || 0;

      return NextResponse.json({
        minScore,
        totalCreators,
        eligibleCreators,
      });
    } catch (error) {
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Failed to fetch leaderboard stats" },
        { status: 500 },
      );
    }
  }

  // For top 200 request, try to get from cache first
  if (page === 1 && perPage === 200) {
    try {
      const [cachedData, cachedTotalScores] = await Promise.all([
        redis.get<string>(CACHE_KEYS.TOP_200),
        redis.get<string>(CACHE_KEYS.TOP_200_TOTAL_SCORES),
      ]);

      if (cachedData && cachedTotalScores) {
        return NextResponse.json({
          entries: JSON.parse(cachedData),
          totalScores: parseInt(cachedTotalScores, 10),
        });
      }
    } catch (error) {
      console.error("Cache error:", error);
      // Continue with normal flow if cache fails
    }
  }

  // For regular requests or if cache miss
  try {
    let profiles: Profile[];

    if (page === 1 && perPage === 200) {
      // Fetch all 200 entries in batches
      profiles = await fetchTop200Entries(apiKey);
    } else {
      // Regular paginated request
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
      ].join("&");

      const res = await fetch(
        `https://api.talentprotocol.com/search/advanced/profiles?${queryString}`,
        {
          headers: {
            Accept: "application/json",
            "X-API-KEY": apiKey,
          },
        },
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const json = await res.json();
      profiles = json.profiles || [];
    }

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
    mapped.sort((a, b) => b.score - a.score);

    // Assign ranks
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
      return {
        ...entry,
        rank,
      };
    });

    // If this is a top 200 request, cache the results
    if (page === 1 && perPage === 200) {
      try {
        const totalScores = ranked.reduce((sum, entry) => sum + entry.score, 0);
        await Promise.all([
          redis.setex(
            CACHE_KEYS.TOP_200,
            CACHE_DURATION,
            JSON.stringify(ranked),
          ),
          redis.setex(
            CACHE_KEYS.TOP_200_TOTAL_SCORES,
            CACHE_DURATION,
            totalScores.toString(),
          ),
        ]);
      } catch (error) {
        console.error("Cache error:", error);
        // Continue even if caching fails
      }
    }

    return NextResponse.json({ entries: ranked });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_10_MINUTES } from "@/lib/cache-keys";
import { PROJECT_ACCOUNTS_TO_EXCLUDE } from "@/lib/constants";
import { getBoostedProfilesData } from "@/app/services/leaderboardService";

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

async function fetchTop200Entries(apiKey: string): Promise<Profile[]> {
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
      console.error(`API Error for page ${page}:`, errorText);
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

async function fetchPaginatedProfiles(
  apiKey: string,
  page: number,
  perPage: number,
): Promise<Profile[]> {
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
}

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  console.log("🎯 [BASIC API] Starting basic leaderboard request");

  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    console.error("❌ [BASIC API] Missing Talent API key");
    return NextResponse.json(
      { error: "Missing Talent API key" },
      { status: 500 },
    );
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const perPage = parseInt(
    searchParams.get("per_page") || searchParams.get("perPage") || "200",
    10,
  );

  console.log(`📊 [BASIC API] Requesting page ${page}, perPage ${perPage}`);

  try {
    // Cache the entire processed response for page 1, perPage 200
    if (page === 1 && perPage === 200) {
      console.log("🔄 [BASIC API] Fetching cached leaderboard response");
      const cachedResponse = unstable_cache(
        async () => {
          console.log("🔄 [BASIC API] Cache miss, processing full leaderboard");

          // Fetch profiles
          const profiles = await fetchTop200Entries(apiKey);
          console.log(
            `✅ [BASIC API] Retrieved ${profiles.length} profiles from Talent API`,
          );

          // Filter out project accounts
          const originalCount = profiles.length;
          const filteredProfiles = profiles.filter(
            (profile) => !PROJECT_ACCOUNTS_TO_EXCLUDE.includes(profile.id),
          );
          console.log(
            `🔍 [BASIC API] Filtered ${originalCount - filteredProfiles.length} project accounts`,
          );

          // Fetch boosted profiles for integration
          console.log(
            "🔄 [BASIC API] Fetching boosted profiles for integration",
          );
          let boostedProfileIds: string[] = [];
          try {
            boostedProfileIds = await getBoostedProfilesData();
            console.log(
              `✅ [BASIC API] Retrieved ${boostedProfileIds.length} boosted profiles`,
            );
          } catch (error) {
            console.warn(
              "⚠️ [BASIC API] Failed to fetch boosted profiles:",
              error,
            );
            boostedProfileIds = [];
          }

          // Map to basic entries (no rewards) with boosted status
          console.log(
            "🔄 [BASIC API] Mapping profiles to entries with boosted status",
          );
          const mapped = filteredProfiles.map((profile: Profile) => {
            const creatorScores = Array.isArray(profile.scores)
              ? profile.scores
                  .filter((s) => s.slug === "creator_score")
                  .map((s) => s.points ?? 0)
              : [];
            const score =
              creatorScores.length > 0 ? Math.max(...creatorScores) : 0;
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
          console.log("🔄 [BASIC API] Sorting and ranking entries");
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
          const boostedCreatorsCount = ranked.filter(
            (entry) => entry.isBoosted,
          ).length;
          console.log(
            `✅ [BASIC API] Found ${boostedCreatorsCount} boosted creators in top ${ranked.length} entries`,
          );

          return {
            entries: ranked,
            boostedCreatorsCount,
          };
        },
        [CACHE_KEYS.LEADERBOARD_BASIC],
        { revalidate: CACHE_DURATION_10_MINUTES },
      );

      const result = await cachedResponse();
      console.log(
        `✅ [BASIC API] Returning ${result.entries.length} cached entries`,
      );
      console.log(
        `🏆 [BASIC API] Top 3:`,
        result.entries
          .slice(0, 3)
          .map(
            (e) =>
              `${e.rank}. ${e.name} (${e.score})${e.isBoosted ? " 🚀" : ""}`,
          ),
      );

      return NextResponse.json(result);
    } else {
      // For non-cached requests (pagination), process normally
      console.log(`🔄 [BASIC API] Fetching paginated profiles (page ${page})`);
      const profiles = await fetchPaginatedProfiles(apiKey, page, perPage);
      console.log(
        `✅ [BASIC API] Retrieved ${profiles.length} profiles from paginated request`,
      );

      // Filter out project accounts
      const originalCount = profiles.length;
      const filteredProfiles = profiles.filter(
        (profile) => !PROJECT_ACCOUNTS_TO_EXCLUDE.includes(profile.id),
      );
      console.log(
        `🔍 [BASIC API] Filtered ${originalCount - filteredProfiles.length} project accounts`,
      );

      // Fetch boosted profiles for integration
      console.log("🔄 [BASIC API] Fetching boosted profiles for integration");
      let boostedProfileIds: string[] = [];
      try {
        boostedProfileIds = await getBoostedProfilesData();
        console.log(
          `✅ [BASIC API] Retrieved ${boostedProfileIds.length} boosted profiles`,
        );
      } catch (error) {
        console.warn("⚠️ [BASIC API] Failed to fetch boosted profiles:", error);
        boostedProfileIds = [];
      }

      // Map to basic entries (no rewards) with boosted status
      console.log(
        "🔄 [BASIC API] Mapping profiles to entries with boosted status",
      );
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
      console.log("🔄 [BASIC API] Sorting and ranking entries");
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
      const boostedCreatorsCount = ranked.filter(
        (entry) => entry.isBoosted,
      ).length;
      console.log(
        `✅ [BASIC API] Found ${boostedCreatorsCount} boosted creators in top ${ranked.length} entries`,
      );

      console.log(`✅ [BASIC API] Returning ${ranked.length} ranked entries`);
      return NextResponse.json({
        entries: ranked,
        boostedCreatorsCount,
      });
    }
  } catch (error) {
    console.error("❌ [BASIC API] API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 },
    );
  }
}

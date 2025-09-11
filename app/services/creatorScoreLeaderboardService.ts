import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_10_MINUTES } from "@/lib/cache-keys";
import { talentApiClient } from "@/lib/talent-api-client";

// Type for score data structure from Talent API
interface TalentScore {
  slug: string;
  points?: number;
}

export interface CreatorProfile {
  id: string;
  display_name?: string;
  image_url?: string;
  score: number;
  rank?: number;
  total_earnings?: number;
}

export interface CreatorScoreLeaderboardResponse {
  profiles: CreatorProfile[];
  total: number;
  hasMore: boolean;
}

/**
 * Fetch Creator Score leaderboard profiles with total earnings
 * @param offset Number of profiles to skip (for pagination)
 * @param limit Number of profiles to fetch (default 50)
 */
export async function getCreatorScoreLeaderboard(
  offset: number = 0,
  limit: number = 50,
): Promise<CreatorScoreLeaderboardResponse> {
  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Talent API key");
  }

  const result = await unstable_cache(
    async () => {
      // Calculate proper pagination parameters
      const page = Math.floor(offset / limit) + 1;
      const pageOffset = offset % limit;

      // Fetch profiles sorted by Creator Score
      const baseUrl = "https://api.talentprotocol.com/search/advanced/profiles";

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
        page: page,
        per_page: limit,
      };

      const queryString = [
        `query=${encodeURIComponent(JSON.stringify(data.query))}`,
        `sort=${encodeURIComponent(JSON.stringify(data.sort))}`,
        `page=${page}`,
        `per_page=${limit}`,
        `view=scores_minimal`,
      ].join("&");

      const response = await fetch(`${baseUrl}?${queryString}`, {
        headers: {
          Accept: "application/json",
          "X-API-KEY": apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch profiles: ${errorText}`);
      }

      const json = await response.json();
      const profiles = json.profiles || [];

      // For exact offset alignment, handle partial page slicing if needed
      const actualProfiles =
        pageOffset > 0 ? profiles.slice(pageOffset) : profiles;

      // Get total earnings for each profile
      const profilesWithEarnings = await Promise.allSettled(
        actualProfiles.map(
          async (
            profile: {
              id: string;
              display_name?: string;
              image_url?: string;
              scores?: TalentScore[];
            },
            index: number,
          ) => {
            try {
              // Get total earnings using data_points endpoint
              const earningsResponse = await fetch(
                `https://api.talentprotocol.com/data_points?id=${profile.id}&slug=total_creator_earnings`,
                {
                  headers: {
                    Accept: "application/json",
                    "X-API-KEY": apiKey,
                  },
                },
              );

              let totalEarnings: number | undefined;
              if (earningsResponse.ok) {
                const earningsData = await earningsResponse.json();
                totalEarnings = earningsData.readable_value || undefined;
              }

              // Extract Creator Score from scores array (same logic as search hook)
              const creatorScores = Array.isArray(profile.scores)
                ? profile.scores
                    .filter((s) => s.slug === "creator_score")
                    .map((s) => s.points ?? 0)
                : [];
              const score =
                creatorScores.length > 0 ? Math.max(...creatorScores) : 0;

              return {
                id: profile.id,
                display_name: profile.display_name,
                image_url: profile.image_url,
                score: score,
                rank: offset + index + 1, // Calculate rank based on global position
                total_earnings: totalEarnings,
              };
            } catch (error) {
              console.error(
                `Error fetching earnings for profile ${profile.id}:`,
                error,
              );
              // Extract Creator Score from scores array (same logic as search hook)
              const creatorScores = Array.isArray(profile.scores)
                ? profile.scores
                    .filter((s) => s.slug === "creator_score")
                    .map((s) => s.points ?? 0)
                : [];
              const score =
                creatorScores.length > 0 ? Math.max(...creatorScores) : 0;

              return {
                id: profile.id,
                display_name: profile.display_name,
                image_url: profile.image_url,
                score: score,
                rank: offset + index + 1, // Calculate rank based on global position
                total_earnings: undefined,
              };
            }
          },
        ),
      );

      // Process results, handling any failures gracefully
      const processedProfiles = profilesWithEarnings
        .map((result) => {
          if (result.status === "fulfilled") {
            return result.value;
          } else {
            console.error("Error processing profile:", result.reason);
            return null;
          }
        })
        .filter((profile): profile is CreatorProfile => profile !== null);

      return {
        profiles: processedProfiles,
        total: json.pagination?.total || profiles.length,
        hasMore: offset + limit < (json.pagination?.total || profiles.length),
      };
    },
    [CACHE_KEYS.LEADERBOARD + `-creator-score-${offset}-${limit}`],
    {
      revalidate: CACHE_DURATION_10_MINUTES,
      tags: [CACHE_KEYS.LEADERBOARD + "-creator-score"],
    },
  )();

  return result;
}

/**
 * Get a specific user's profile data for pinned display
 * @param talentUuid The user's Talent Protocol UUID
 */
export async function getUserProfileData(
  talentUuid: string,
): Promise<CreatorProfile | null> {
  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Talent API key");
  }

  try {
    // Get user profile
    const profileResponse = await talentApiClient.getProfile({
      talent_protocol_id: talentUuid,
    });

    if (!profileResponse.ok) {
      return null;
    }

    const profileData = await profileResponse.json();
    const profile = profileData.profile;

    if (!profile) {
      return null;
    }

    // Get total earnings using data_points endpoint
    let totalEarnings: number | undefined;
    try {
      const earningsResponse = await fetch(
        `https://api.talentprotocol.com/data_points?id=${talentUuid}&slug=total_creator_earnings`,
        {
          headers: {
            Accept: "application/json",
            "X-API-KEY": apiKey,
          },
        },
      );

      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        totalEarnings = earningsData.readable_value || undefined;
      }
    } catch (error) {
      console.error(`Error fetching earnings for user ${talentUuid}:`, error);
    }

    // Extract Creator Score from scores array (same logic as search hook)
    const creatorScores = Array.isArray(profile.scores)
      ? profile.scores
          .filter((s: TalentScore) => s.slug === "creator_score")
          .map((s: TalentScore) => s.points ?? 0)
      : [];
    const score = creatorScores.length > 0 ? Math.max(...creatorScores) : 0;

    return {
      id: profile.id,
      display_name: profile.display_name,
      image_url: profile.image_url,
      score: score,
      rank: profile.rank, // Use rank from profile if available
      total_earnings: totalEarnings,
    };
  } catch (error) {
    console.error(`Error fetching user profile data for ${talentUuid}:`, error);
    return null;
  }
}

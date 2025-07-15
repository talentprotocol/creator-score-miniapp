import { SearchResult } from "./types";

// Type for Talent API profile response structure
interface TalentApiProfile {
  id: string;
  name?: string;
  display_name?: string;
  image_url?: string;
  scores?: Array<{
    slug: string;
    points?: number;
  }>;
  accounts?: Array<{
    source: string;
    identifier: string;
    username?: string;
    followers_count?: number;
  }>;
}

/**
 * Search for profiles by name/handle/identity
 */
export async function searchProfiles({
  query,
  page = 1,
  perPage = 10,
}: {
  query: string;
  page?: number;
  perPage?: number;
}): Promise<{
  results: SearchResult[];
  hasMore: boolean;
  totalCount: number;
}> {
  try {
    const res = await fetch(
      `/api/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
    );

    if (!res.ok) {
      let errorMessage = "Failed to search profiles";

      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = res.statusText || errorMessage;
      }

      // Provide user-friendly error messages
      if (res.status === 400) {
        throw new Error("Please enter at least 2 characters to search");
      } else if (res.status === 429) {
        throw new Error(
          "Too many requests. Please wait a moment and try again",
        );
      } else if (res.status >= 500) {
        throw new Error(
          "Search service is temporarily unavailable. Please try again later",
        );
      } else if (res.status === 401 || res.status === 403) {
        throw new Error("Search service is currently unavailable");
      } else {
        throw new Error(errorMessage);
      }
    }

    const json = await res.json();

    // Handle cases where API returns success but with error field
    if (json.error) {
      throw new Error(json.error);
    }

    // Transform API response to SearchResult format
    const results: SearchResult[] = (json.profiles || []).map(
      (profile: TalentApiProfile) => transformProfileToSearchResult(profile),
    );

    return {
      results,
      hasMore: json.pagination
        ? json.pagination.current_page < json.pagination.last_page
        : false,
      totalCount: json.pagination?.total || results.length,
    };
  } catch (error) {
    // Re-throw with preserved error message for UI handling
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred while searching");
  }
}

/**
 * Transform a TalentApiProfile from the API into a SearchResult for the UI
 */
function transformProfileToSearchResult(
  profile: TalentApiProfile,
): SearchResult {
  // Extract Creator Score from scores array (same logic as leaderboard)
  const creatorScores = Array.isArray(profile.scores)
    ? profile.scores
        .filter((s) => s.slug === "creator_score")
        .map((s) => s.points ?? 0)
    : [];
  const score = creatorScores.length > 0 ? Math.max(...creatorScores) : 0;

  return {
    id: profile.id,
    name: profile.display_name || profile.name || "Unknown",
    avatarUrl: profile.image_url || undefined,
    score,
  };
}

/**
 * Get top creators by Creator Score (used for initial page load)
 */
export async function getTopCreators({
  page = 1,
  perPage = 10,
}: {
  page?: number;
  perPage?: number;
} = {}): Promise<{
  results: SearchResult[];
  hasMore: boolean;
  totalCount: number;
}> {
  try {
    const res = await fetch(
      `/api/leaderboard?page=${page}&per_page=${perPage}`,
    );

    if (!res.ok) {
      let errorMessage = "Failed to fetch top creators";

      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = res.statusText || errorMessage;
      }

      // Provide user-friendly error messages
      if (res.status >= 500) {
        throw new Error(
          "Leaderboard service is temporarily unavailable. Please try again later",
        );
      } else if (res.status === 429) {
        throw new Error(
          "Too many requests. Please wait a moment and try again",
        );
      } else {
        throw new Error(errorMessage);
      }
    }

    const json = await res.json();

    // Handle cases where API returns success but with error field
    if (json.error) {
      throw new Error(json.error);
    }

    // Transform leaderboard entries to SearchResult format
    const results: SearchResult[] = (json.entries || []).map(
      (entry: {
        talent_protocol_id?: string;
        id: string;
        name: string;
        pfp?: string;
        score: number;
      }) => ({
        id: entry.talent_protocol_id || entry.id,
        name: entry.name,
        avatarUrl: entry.pfp,
        score: entry.score,
      }),
    );

    return {
      results,
      hasMore: results.length === perPage, // If we got full page, assume more exist
      totalCount: json.totalCreators || results.length,
    };
  } catch (error) {
    // Re-throw with preserved error message for UI handling
    throw error instanceof Error
      ? error
      : new Error("An unexpected error occurred while loading top creators");
  }
}

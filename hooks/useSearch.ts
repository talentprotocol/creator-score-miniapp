"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SearchResult } from "@/lib/types";

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
 * Search for profiles by name/handle/identity
 */
async function searchProfiles({
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
 * Get top creators by Creator Score (used for initial page load)
 */
async function getTopCreators({
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
      let errorMessage = "Failed to fetch top creators";

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      // Provide user-friendly error messages
      if (response.status >= 500) {
        throw new Error(
          "Leaderboard service is temporarily unavailable. Please try again later",
        );
      } else if (response.status === 429) {
        throw new Error(
          "Too many requests. Please wait a moment and try again",
        );
      } else {
        throw new Error(errorMessage);
      }
    }

    const json = await response.json();

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

export function useSearch(loadSearch: boolean) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading for initial top creators
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Debouncing state
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const currentQuery = useRef("");

  const performSearch = useCallback(
    async (
      searchQuery: string,
      searchPage: number = 1,
      isLoadMore: boolean = false,
      isRetry: boolean = false,
    ) => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) {
        setResults([]);
        setHasMore(false);
        setTotalCount(0);
        setError(null);
        setRetryCount(0);
        return;
      }

      setLoading(true);
      if (!isRetry) {
        setError(null);
        setRetryCount(0);
      }

      try {
        const data = await searchProfiles({
          query: searchQuery.trim(),
          page: searchPage,
          perPage: 10,
        });

        if (isLoadMore) {
          setResults((prev) => [...prev, ...data.results]);
        } else {
          setResults(data.results);
        }

        setHasMore(data.hasMore);
        setTotalCount(data.totalCount);
        setPage(searchPage);
        setError(null);
        setRetryCount(0);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to search profiles";
        setError(errorMessage);

        if (!isLoadMore) {
          setResults([]);
          setHasMore(false);
          setTotalCount(0);
        }

        if (isRetry) {
          setRetryCount((prev) => prev + 1);
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Store current query for comparison
      currentQuery.current = searchQuery;

      // Set up new debounced search
      debounceTimer.current = setTimeout(() => {
        // Only proceed if the query hasn't changed during debounce period
        if (currentQuery.current === searchQuery) {
          performSearch(searchQuery, 1, false);
        }
      }, 300); // 300ms debounce
    },
    [performSearch],
  );

  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      setPage(1);

      // If query is cleared or too short, clear results immediately
      if (!newQuery.trim() || newQuery.trim().length < 2) {
        setResults([]);
        setHasMore(false);
        setTotalCount(0);
        setError(null);
        setLoading(false);

        // Clear any pending debounced search
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
        return;
      }

      // Set loading immediately to prevent "no results" flash during debounce
      setLoading(true);
      debouncedSearch(newQuery);
    },
    [debouncedSearch],
  );

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    const nextPage = page + 1;

    if (query.trim()) {
      // Load more search results
      await performSearch(query, nextPage, true);
    } else {
      // Load more top creators
      try {
        setLoading(true);
        setError(null);
        const data = await getTopCreators({ page: nextPage, perPage: 10 });
        setResults((prev) => [...prev, ...data.results]);
        setHasMore(data.hasMore);
        setTotalCount(data.totalCount);
        setPage(nextPage);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load more creators",
        );
      } finally {
        setLoading(false);
      }
    }
  }, [loading, hasMore, query, page, performSearch]);

  const retry = useCallback(async () => {
    if (query.trim()) {
      await performSearch(query, 1, false, true);
    } else {
      await loadTopCreators(true);
    }
  }, [query, performSearch]);

  const loadTopCreators = useCallback(async (isRetry: boolean = false) => {
    try {
      setLoading(true);
      if (!isRetry) {
        setError(null);
        setRetryCount(0);
      }

      const data = await getTopCreators({ page: 1, perPage: 10 });
      setResults(data.results);
      setHasMore(data.hasMore);
      setTotalCount(data.totalCount);
      setPage(1);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load top creators";
      setError(errorMessage);
      setResults([]);
      setHasMore(false);
      setTotalCount(0);

      if (isRetry) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setHasMore(false);
    setTotalCount(0);
    setError(null);
    setPage(1);
    setRetryCount(0);

    // Clear any pending debounced search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, []);

  // Load top creators on mount
  useEffect(() => {
    if (loadSearch) {
      loadTopCreators();
    }
  }, [loadSearch]); // Only run once on mount

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    query,
    results,
    loading,
    error,
    hasMore,
    totalCount,
    retryCount,
    handleQueryChange,
    loadMore,
    clearSearch,
    retry,
  };
}

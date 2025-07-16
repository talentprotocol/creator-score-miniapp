"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SearchResult } from "@/app/services/types";
import { searchProfiles, getTopCreators } from "@/app/services/searchService";

export function useSearch() {
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
    loadTopCreators();
  }, [loadTopCreators]);

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

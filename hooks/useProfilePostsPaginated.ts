"use client";

import { useState, useEffect, useCallback } from "react";
import type { Post } from "@/app/services/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { getPostsForTalentId } from "@/app/services/postsService";

export function useProfilePostsPaginated(
  talentUUID: string,
  perPage: number = 10,
) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadInitialData = useCallback(async () => {
    if (!talentUUID) return;

    const cacheKey = `posts_page_1_${talentUUID}_${perPage}`;

    // Check cache first
    const cachedData = getCachedData<Post[]>(
      cacheKey,
      CACHE_DURATIONS.PROFILE_DATA, // 5 minute cache for posts
    );

    if (cachedData && cachedData.length > 0) {
      setPosts(cachedData);
      setPage(1);
      setHasMore(cachedData.length >= perPage);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getPostsForTalentId(talentUUID, { page: 1, perPage });
      setPosts(data);
      setPage(1);
      setHasMore(data.length >= perPage);

      // Cache the initial data
      setCachedData(cacheKey, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [talentUUID, perPage]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !talentUUID) return;

    setLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const data = await getPostsForTalentId(talentUUID, {
        page: nextPage,
        perPage,
      });

      if (data.length === 0) {
        setHasMore(false);
        return;
      }

      // Combine previous and new posts
      const combined = [...posts, ...data];
      setPosts(combined);
      setPage(nextPage);
      setHasMore(data.length >= perPage);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more posts",
      );
    } finally {
      setLoading(false);
    }
  }, [posts, page, perPage, loading, hasMore, talentUUID]);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const refresh = useCallback(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    loadInitialData();
  }, [loadInitialData]);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

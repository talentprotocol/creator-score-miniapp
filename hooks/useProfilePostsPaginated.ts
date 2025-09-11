"use client";

import { useState, useEffect, useCallback } from "react";
import type { Post, PostsResponse } from "@/lib/types";

/**
 * CLIENT-SIDE ONLY: Fetches posts via API route (follows coding principles)
 */
async function getPostsForTalentId(
  talentId: string | number,
  options: { page?: number; perPage?: number } = {},
): Promise<Post[]> {
  try {
    const { page = 1, perPage = 10 } = options;
    const params = new URLSearchParams({
      talent_protocol_id: String(talentId),
      page: String(page),
      per_page: String(perPage),
    });
    const response = await fetch(`/api/talent-posts?${params.toString()}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data: PostsResponse = await response.json();

    if (!Array.isArray(data.posts)) return [];

    // Sort posts by date, newest first
    return data.posts.sort(
      (a, b) =>
        new Date(b.onchain_created_at).getTime() -
        new Date(a.onchain_created_at).getTime(),
    );
  } catch (error) {
    console.error(
      "[useProfilePostsPaginated] Client-side fetch failed:",
      error,
    );
    return [];
  }
}

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

    setLoading(true);
    setError(null);

    try {
      const data = await getPostsForTalentId(talentUUID, { page: 1, perPage });
      setPosts(data);
      setPage(1);
      setHasMore(data.length >= perPage);
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

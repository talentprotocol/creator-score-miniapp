import { useState, useEffect, useCallback } from "react";
import type { Post } from "@/app/services/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { getPostsForTalentId } from "@/app/services/postsService";
import { CACHE_KEYS } from "@/lib/cache-keys";

export function useProfilePosts(talentUUID: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!talentUUID) return;

    const cacheKey = `${CACHE_KEYS.PROFILE_POSTS}_${talentUUID}`;

    // Check cache first
    const cachedPosts = getCachedData<Post[]>(
      cacheKey,
      CACHE_DURATIONS.PROFILE_DATA,
    );
    if (cachedPosts) {
      setPosts(cachedPosts);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const postsData = await getPostsForTalentId(talentUUID);
      setPosts(postsData);

      // Cache the posts data
      setCachedData(cacheKey, postsData);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [talentUUID]); // Only depend on talentUUID

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]); // Only depend on the memoized function

  return { posts, loading, error };
}

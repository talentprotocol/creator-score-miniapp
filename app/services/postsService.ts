import { Post, PostsResponse } from "@/lib/types";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_30_MINUTES } from "@/lib/cache-keys";

/**
 * SERVER-SIDE ONLY: Internal function to fetch posts for a Talent Protocol ID by paginating through all pages
 * This function should only be called from server-side code (layouts, API routes)
 */
async function getAllPostsForTalentIdInternal(
  talentId: string | number,
): Promise<Post[]> {
  try {
    const { talentApiClient } = await import("@/lib/talent-api-client");
    const allPosts: Post[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    const perPage = 25;

    while (hasMorePages) {
      const params = {
        talent_protocol_id: String(talentId),
        page: String(currentPage),
        per_page: String(perPage),
      };

      const response = await talentApiClient.getPosts(params);
      if (!response.ok) {
        console.error(`[PostsService] Talent API error: ${response.status}`);
        throw new Error(`Talent API error: ${response.status}`);
      }

      const data: PostsResponse = await response.json();
      if (!Array.isArray(data.posts)) break;

      allPosts.push(...data.posts);

      // Check if there are more pages
      if (data.pagination) {
        hasMorePages = currentPage < data.pagination.last_page;
      } else {
        hasMorePages = data.posts.length === perPage;
      }

      currentPage++;
    }

    // Sort all posts by date, newest first
    return allPosts.sort(
      (a, b) =>
        new Date(b.onchain_created_at).getTime() -
        new Date(a.onchain_created_at).getTime(),
    );
  } catch (error) {
    console.error("[PostsService] Failed to fetch posts:", error);
    throw error; // Don't return empty array silently - let the error bubble up
  }
}

/**
 * SERVER-SIDE ONLY: Cached version of getAllPostsForTalentId
 * This function should only be called from server-side code (layouts, API routes)
 * Uses proper caching as required by coding principles
 */
export function getAllPostsForTalentId(talentId: string | number) {
  return unstable_cache(
    async () => getAllPostsForTalentIdInternal(talentId),
    [`${CACHE_KEYS.POSTS}-${talentId}`],
    {
      tags: [`${CACHE_KEYS.POSTS}-${talentId}`, CACHE_KEYS.POSTS],
      revalidate: CACHE_DURATION_30_MINUTES, // Align with client-side cache duration
    },
  );
}

import { Post, PostsResponse } from "./types";

/**
 * Fetches posts for a Talent Protocol ID from the API with pagination support
 */
export async function getPostsForTalentId(
  talentId: string | number,
  options: { page?: number; perPage?: number } = {},
): Promise<Post[]> {
  try {
    const { page = 1, perPage = 10 } = options;
    const baseUrl = "/api/talent-posts";
    const params = new URLSearchParams({
      talent_protocol_id: String(talentId),
      page: String(page),
      per_page: String(perPage),
    });
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) throw new Error(`Talent API error: ${response.status}`);
    const data: PostsResponse = await response.json();

    if (!Array.isArray(data.posts)) return [];

    // Sort posts by date, newest first
    return data.posts.sort(
      (a, b) =>
        new Date(b.onchain_created_at).getTime() -
        new Date(a.onchain_created_at).getTime(),
    );
  } catch {
    return [];
  }
}

/**
 * Fetches all posts for a Talent Protocol ID by paginating through all pages
 */
export async function getAllPostsForTalentId(
  talentId: string | number,
): Promise<Post[]> {
  try {
    const allPosts: Post[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    const perPage = 25; // Use the API's default page size

    while (hasMorePages) {
      let data: PostsResponse;

      if (typeof window !== "undefined") {
        // Client-side: use API route
        const params = new URLSearchParams({
          talent_protocol_id: String(talentId),
          page: String(currentPage),
          per_page: String(perPage),
        });
        const response = await fetch(`/api/talent-posts?${params.toString()}`);
        if (!response.ok)
          throw new Error(`Talent API error: ${response.status}`);
        data = await response.json();
      } else {
        // Server-side: call Talent API directly
        const { talentApiClient } = await import("@/lib/talent-api-client");
        const params = {
          talent_protocol_id: String(talentId),
          page: String(currentPage),
          per_page: String(perPage),
        };
        const response = await talentApiClient.getPosts(params);
        if (!response.ok)
          throw new Error(`Talent API error: ${response.status}`);
        data = await response.json();
      }

      if (!Array.isArray(data.posts)) break;

      // Add posts from this page
      allPosts.push(...data.posts);

      // Check if there are more pages
      if (data.pagination) {
        hasMorePages = currentPage < data.pagination.last_page;
      } else {
        // Fallback: if no pagination info, assume no more pages if we got fewer posts than requested
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
  } catch {
    return [];
  }
}

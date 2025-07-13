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
 * Fetches all posts for a Talent Protocol ID without pagination
 */
export async function getAllPostsForTalentId(
  talentId: string | number,
): Promise<Post[]> {
  try {
    const baseUrl = "/api/talent-posts";
    const params = new URLSearchParams({
      talent_protocol_id: String(talentId),
      page: "1",
      per_page: "1000", // Large number to get all posts
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

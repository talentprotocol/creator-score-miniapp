"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Post, PostsResponse } from "@/lib/types";

/**
 * CLIENT-SIDE ONLY: Fetches all posts via API route (follows coding principles)
 */
async function getAllPostsForTalentId(
  talentId: string | number,
): Promise<Post[]> {
  try {
    const allPosts: Post[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    const perPage = 25;

    while (hasMorePages) {
      const params = new URLSearchParams({
        talent_protocol_id: String(talentId),
        page: String(currentPage),
        per_page: String(perPage),
      });
      const response = await fetch(`/api/talent-posts?${params.toString()}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
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
    console.error("[useProfilePostsAll] Client-side fetch failed:", error);
    return [];
  }
}

export interface YearlyPostData {
  year: number;
  months: number[];
  total: number;
}

export function useProfilePostsAll(talentUUID: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPosts = useCallback(async () => {
    if (!talentUUID) return;

    try {
      setLoading(true);
      setError(null);

      const postsData = await getAllPostsForTalentId(talentUUID);
      setPosts(postsData);
    } catch (err) {
      console.error("Error fetching all posts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [talentUUID]);

  useEffect(() => {
    fetchAllPosts();
  }, [fetchAllPosts]);

  // Process posts into yearly data for chart
  const yearlyData = useMemo((): YearlyPostData[] => {
    if (posts.length === 0) return [];

    // Group posts by year and month
    const yearMonthCounts: Record<string, Record<string, number>> = {};

    posts.forEach((post) => {
      const date = new Date(post.onchain_created_at);
      const year = date.getFullYear().toString();
      const month = date.getMonth(); // 0-11

      if (!yearMonthCounts[year]) {
        yearMonthCounts[year] = {};
      }
      if (!yearMonthCounts[year][month]) {
        yearMonthCounts[year][month] = 0;
      }
      yearMonthCounts[year][month]++;
    });

    // Convert to YearlyPostData format
    const years = Object.keys(yearMonthCounts)
      .map(Number)
      .sort((a, b) => a - b);

    return years.map((year) => {
      const months = Array(12).fill(0);
      const yearData = yearMonthCounts[year.toString()];

      // Fill in the months that have posts
      Object.keys(yearData).forEach((monthStr) => {
        const monthIndex = parseInt(monthStr);
        months[monthIndex] = yearData[monthStr];
      });

      const total = months.reduce((sum, count) => sum + count, 0);

      return {
        year,
        months,
        total,
      };
    });
  }, [posts]);

  return { posts, yearlyData, loading, error };
}

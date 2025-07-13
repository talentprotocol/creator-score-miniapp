"use client";

import { useState, useEffect, useMemo } from "react";
import type { Post } from "@/app/services/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { getAllPostsForTalentId } from "@/app/services/postsService";

export interface YearlyPostData {
  year: number;
  months: number[];
  total: number;
}

export function useProfilePostsAll(talentUUID: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    async function fetchAllPosts() {
      const cacheKey = `all_posts_${talentUUID}`;

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

        const postsData = await getAllPostsForTalentId(talentUUID);
        setPosts(postsData);

        // Cache the posts data
        setCachedData(cacheKey, postsData);
      } catch (err) {
        console.error("Error fetching all posts:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch posts");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    if (talentUUID) {
      fetchAllPosts();
    }
  }, [talentUUID]);

  return { posts, yearlyData, loading, error };
}

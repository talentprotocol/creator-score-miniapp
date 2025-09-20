"use client";

import { useState, useEffect, useCallback } from "react";
import { CreatorProfile } from "@/app/services/creatorScoreLeaderboardService";

interface UseCreatorScoreLeaderboardReturn {
  profiles: CreatorProfile[];
  pinnedUser: CreatorProfile | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  showMore: () => void;
  refetch: () => void;
}

const PROFILES_PER_PAGE = 50;

/**
 * Hook to manage Creator Score leaderboard data with pagination
 */
export function useCreatorScoreLeaderboard(
  talentUuid?: string | null,
): UseCreatorScoreLeaderboardReturn {
  const [profiles, setProfiles] = useState<CreatorProfile[]>([]);
  const [pinnedUser, setPinnedUser] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchData = useCallback(
    async (currentOffset: number, reset: boolean = false) => {
      try {
        if (reset) {
          setLoading(true);
        } else {
          setIsLoadingMore(true);
        }
        setError(null);

        const params = new URLSearchParams({
          offset: currentOffset.toString(),
          limit: PROFILES_PER_PAGE.toString(),
        });

        if (talentUuid) {
          params.append("talentUuid", talentUuid);
        }

        const response = await fetch(
          `/api/leaderboard/creatorscore?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (reset) {
          setProfiles(data.profiles);
        } else {
          setProfiles((prev) => [...prev, ...data.profiles]);
        }

        setPinnedUser(data.pinnedUser || null);
        setHasMore(data.hasMore);
      } catch (err) {
        console.error("Error fetching creator score leaderboard:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [talentUuid],
  );

  // Initial load
  useEffect(() => {
    setOffset(0);
    fetchData(0, true);
  }, [fetchData]);

  const showMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const newOffset = offset + PROFILES_PER_PAGE;
      setOffset(newOffset);
      fetchData(newOffset, false);
    }
  }, [offset, hasMore, isLoadingMore, fetchData]);

  const refetch = useCallback(() => {
    setOffset(0);
    fetchData(0, true);
  }, [fetchData]);

  return {
    profiles,
    pinnedUser,
    loading,
    error,
    hasMore,
    showMore,
    refetch,
  };
}

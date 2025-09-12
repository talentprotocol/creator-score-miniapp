"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BasecampProfile,
  SortColumn,
  SortOrder,
  BasecampTab,
} from "@/lib/types/basecamp";

interface UseBasecampLeaderboardReturn {
  profiles: BasecampProfile[];
  pinnedUser: BasecampProfile | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  sortColumn: SortColumn;
  sortOrder: SortOrder;
  showMore: () => void;
  setSorting: (column: SortColumn, order: SortOrder) => void;
  refetch: () => void;
}

const PROFILES_PER_PAGE = 50;

export function useBasecampLeaderboard(
  talentUuid?: string | null,
  tab: BasecampTab = "reputation",
): UseBasecampLeaderboardReturn {
  const [profiles, setProfiles] = useState<BasecampProfile[]>([]);
  const [pinnedUser, setPinnedUser] = useState<BasecampProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sortColumn, setSortColumn] = useState<SortColumn>("creator_score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const fetchData = useCallback(
    async (currentOffset: number, reset: boolean = false) => {
      try {
        if (reset) {
          setLoading(true);
        }
        setError(null);

        const params = new URLSearchParams({
          offset: currentOffset.toString(),
          limit: PROFILES_PER_PAGE.toString(),
          sortBy: sortColumn,
          sortOrder: sortOrder,
          tab,
        });

        if (talentUuid) {
          params.append("talentUuid", talentUuid);
        }

        const response = await fetch(
          `/api/basecamp-leaderboard?${params.toString()}`,
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
        console.error("Error fetching basecamp leaderboard:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [talentUuid, sortColumn, sortOrder, tab],
  );

  // Reset and fetch when sorting changes
  useEffect(() => {
    setOffset(0);
    fetchData(0, true);
  }, [fetchData]);

  const showMore = useCallback(() => {
    if (!loading && hasMore) {
      const newOffset = offset + PROFILES_PER_PAGE;
      setOffset(newOffset);
      fetchData(newOffset, false);
    }
  }, [offset, hasMore, loading, fetchData]);

  const setSorting = useCallback((column: SortColumn, order: SortOrder) => {
    setSortColumn(column);
    setSortOrder(order);
    setOffset(0);
  }, []);

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
    sortColumn,
    sortOrder,
    showMore,
    setSorting,
    refetch,
  };
}

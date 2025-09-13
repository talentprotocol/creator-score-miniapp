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
  total: number; // Add total count for tab badges
  sortColumn: SortColumn;
  sortOrder: SortOrder;
  isSorting: boolean;
  offset: number;
  showMore: () => void;
  setSorting: (column: SortColumn, order: SortOrder) => void;
  refetch: () => void;
}

const PROFILES_PER_PAGE = 200;

export function useBasecampLeaderboard(
  talentUuid?: string | null,
  tab: BasecampTab = "reputation",
): UseBasecampLeaderboardReturn {
  const [profiles, setProfiles] = useState<BasecampProfile[]>([]);
  const [pinnedUser, setPinnedUser] = useState<BasecampProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [sortColumn, setSortColumn] = useState<SortColumn>("creator_score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isSorting, setIsSorting] = useState(false);

  const fetchData = useCallback(
    async (
      currentOffset: number,
      reset: boolean = false,
      isSortChange: boolean = false,
    ) => {
      try {
        if (reset) {
          setLoading(true);
        }
        if (isSortChange) {
          setIsSorting(true);
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
          setTotal(data.total || 0);
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
        setIsSorting(false);
      }
    },
    [talentUuid, sortColumn, sortOrder, tab],
  );

  // Reset and fetch when sorting changes
  useEffect(() => {
    setOffset(0);
    fetchData(0, true, true); // Pass isSortChange = true
  }, [fetchData]);

  const showMore = useCallback(() => {
    if (!loading && hasMore && !isSorting) {
      // Prevent pagination during sorting
      const newOffset = offset + PROFILES_PER_PAGE;
      setOffset(newOffset);
      fetchData(newOffset, false, false);
    }
  }, [offset, hasMore, loading, isSorting, fetchData]);

  const setSorting = useCallback((column: SortColumn, order: SortOrder) => {
    setSortColumn(column);
    setSortOrder(order);
    setOffset(0);
  }, []);

  const refetch = useCallback(() => {
    setOffset(0);
    fetchData(0, true, false);
  }, [fetchData]);

  return {
    profiles,
    pinnedUser,
    loading,
    error,
    hasMore,
    total,
    sortColumn,
    sortOrder,
    isSorting,
    offset,
    showMore,
    setSorting,
    refetch,
  };
}

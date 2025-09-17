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
  tab: BasecampTab = "creator",
): UseBasecampLeaderboardReturn {
  const [profiles, setProfiles] = useState<BasecampProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  // Get default sort column based on tab
  const getDefaultSortColumn = (tabValue: BasecampTab): SortColumn => {
    switch (tabValue) {
      case "coins":
        return "zora_creator_coin_market_cap";
      case "creator":
        return "total_earnings";
      case "builder":
        return "rewards_amount";
      default:
        return "total_earnings";
    }
  };

  // Tab-aware sort state - each tab preserves its own sorting
  const [tabSortStates, setTabSortStates] = useState<
    Record<BasecampTab, { column: SortColumn; order: SortOrder }>
  >(() => ({
    coins: { column: "zora_creator_coin_market_cap", order: "desc" },
    creator: { column: "total_earnings", order: "desc" },
    builder: { column: "rewards_amount", order: "desc" },
  }));

  // Current sort state based on active tab
  const sortColumn = tabSortStates[tab].column;
  const sortOrder = tabSortStates[tab].order;
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

        // No longer need to pass talentUuid for server-side pinned user

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

        // No longer using server-side pinned user
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

  // Reset offset when tab changes
  useEffect(() => {
    setOffset(0);
  }, [tab]);

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

  const setSorting = useCallback(
    (column: SortColumn, order: SortOrder) => {
      setTabSortStates((prev) => ({
        ...prev,
        [tab]: { column, order },
      }));
      setOffset(0);
    },
    [tab],
  );

  const refetch = useCallback(() => {
    setOffset(0);
    fetchData(0, true, false);
  }, [fetchData]);

  return {
    profiles,
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

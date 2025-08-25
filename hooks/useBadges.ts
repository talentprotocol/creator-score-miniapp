import { useState, useEffect, useCallback } from "react";
import type { BadgesResponse } from "@/app/services/badgesService";

// Extended response type for profile badges that includes user information
interface ExtendedBadgesResponse extends BadgesResponse {
  user?: {
    id: string;
    identifier: string | null;
  };
}

interface UseBadgesReturn {
  data: ExtendedBadgesResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * BADGES HOOK
 *
 * React hook for fetching badge data from the API with standard loading/error states.
 * Supports both current user badges and profile badges (other users).
 * Follows the project's {data, loading, error} pattern for consistency.
 *
 * @param userId - Optional user ID for development/testing (bypasses Farcaster auth)
 * @param identifier - Optional profile identifier (e.g., "jessepollak") for viewing other users' badges
 * @returns Object with badge data, loading state, and error state
 */
export function useBadges(userId?: string, identifier?: string): UseBadgesReturn {
  const [data, setData] = useState<ExtendedBadgesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Fetch badge data from API with proper error handling */
  const fetchBadges = useCallback(async () => {
    // Don't fetch if no userId or identifier is provided
    if (!userId && !identifier) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      if (identifier) params.append("identifier", identifier);

      const queryString = params.toString();
      const url = `/api/badges?${queryString}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch badges: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch badges");
    } finally {
      setLoading(false);
    }
  }, [userId, identifier]);

  /** Manual refetch function for badge verification */
  const refetch = useCallback(async () => {
    await fetchBadges();
  }, [fetchBadges]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  return { data, loading, error, refetch };
}

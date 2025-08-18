import { useState, useEffect } from "react";
import type { BadgesResponse } from "@/app/services/badgesService";

interface UseBadgesReturn {
  data: BadgesResponse | null;
  loading: boolean;
  error: string | null;
}

/**
 * BADGES HOOK
 *
 * React hook for fetching badge data from the API with standard loading/error states.
 * Follows the project's {data, loading, error} pattern for consistency.
 *
 * @param userId - Optional user ID for development/testing (bypasses Farcaster auth)
 * @returns Object with badge data, loading state, and error state
 */
export function useBadges(userId?: string): UseBadgesReturn {
  const [data, setData] = useState<BadgesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /** Fetch badge data from API with proper error handling */
    async function fetchBadges() {
      try {
        setLoading(true);
        setError(null);

        // Build query params for development/testing
        const params = new URLSearchParams();
        if (userId) {
          params.append("userId", userId);
        }

        const queryString = params.toString();
        const url = `/api/badges${queryString ? `?${queryString}` : ""}`;

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
    }

    fetchBadges();
  }, [userId]);

  return { data, loading, error };
}

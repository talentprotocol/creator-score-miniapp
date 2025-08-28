import { useState, useEffect, useCallback } from "react";
import { BadgeSection, mockBadgeData } from "@/lib/badge-data";

export function useBadges() {
  const [data, setData] = useState<BadgeSection[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // For now, return mock data
      // Later this can be replaced with: const response = await fetch('/api/badges');
      setData(mockBadgeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch badges");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const refetch = useCallback(() => {
    fetchBadges();
  }, [fetchBadges]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

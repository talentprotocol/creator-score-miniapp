"use client";

import { useState, useEffect } from "react";

interface UseOptedOutPercentageReturn {
  percentage: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch the current opted-out percentage from the API
 *
 * @returns Current opted-out percentage, loading state, and error state
 */
export function useOptedOutPercentage(): UseOptedOutPercentageReturn {
  const [percentage, setPercentage] = useState<number>(0); // Start with 0, will be updated with real value
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPercentage() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "/api/user-preferences/opted-out-percentage",
        );
        if (response.ok) {
          const data = await response.json();
          setPercentage(data.percentage);
        } else {
          throw new Error(
            `HTTP ${response.status}: Failed to fetch opted-out percentage`,
          );
        }
      } catch (err) {
        console.error("Error fetching opted-out percentage:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        // Keep default 0% if calculation fails
      } finally {
        setLoading(false);
      }
    }

    fetchPercentage();
  }, []);

  return {
    percentage,
    loading,
    error,
  };
}

"use client";

import { useState, useEffect } from "react";

interface UseBasecampTotalsReturn {
  creatorTotal: number;
  builderTotal: number;
  coinsTotal: number;
  loading: boolean;
  error: string | null;
}

export function useBasecampTotals(): UseBasecampTotalsReturn {
  const [creatorTotal, setCreatorTotal] = useState(0);
  const [builderTotal, setBuilderTotal] = useState(0);
  const [coinsTotal, setCoinsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/basecamp-totals");
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setCreatorTotal(data.creatorTotal || 0);
        setBuilderTotal(data.builderTotal || 0);
        setCoinsTotal(data.coinsTotal || 0);
      } catch (err) {
        console.error("Error fetching basecamp totals:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setCreatorTotal(0);
        setBuilderTotal(0);
        setCoinsTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTotals();
  }, []);

  return {
    creatorTotal,
    builderTotal,
    coinsTotal,
    loading,
    error,
  };
}

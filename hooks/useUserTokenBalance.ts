"use client";

import { useState, useEffect } from "react";

interface UserTokenBalanceResponse {
  balance: number;
  talentUuid: string;
  timestamp: string;
}

interface UserTokenBalanceError {
  error: string;
  fallback?: boolean;
}

export function useUserTokenBalance(talentUuid: string | null) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!talentUuid) {
      setBalance(null);
      setError(null);
      return;
    }

    async function fetchTokenBalance() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/user-token-balance?talentUuid=${talentUuid}`,
        );

        if (!response.ok) {
          const errorData: UserTokenBalanceError = await response.json();

          if (errorData.fallback) {
            // Show fallback - user has no tokens or API failed
            setBalance(0);
            setError(null);
          } else {
            throw new Error(errorData.error || "Failed to fetch token balance");
          }
          return;
        }

        const data: UserTokenBalanceResponse = await response.json();
        setBalance(data.balance);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch token balance",
        );
        // Show fallback on error
        setBalance(0);
      } finally {
        setLoading(false);
      }
    }

    fetchTokenBalance();
  }, [talentUuid]);

  return { balance, loading, error };
}

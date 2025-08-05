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
      console.log(
        `🔄 [USER TOKEN BALANCE HOOK] No talentUuid provided, resetting state`,
      );
      setBalance(null);
      setError(null);
      return;
    }

    async function fetchTokenBalance() {
      console.log(
        `🔄 [USER TOKEN BALANCE HOOK] Starting token balance fetch for talentUuid: ${talentUuid}`,
      );
      setLoading(true);
      setError(null);

      try {
        console.log(
          `🔄 [USER TOKEN BALANCE HOOK] Making API request to /api/user-token-balance`,
        );

        const response = await fetch(
          `/api/user-token-balance?talentUuid=${talentUuid}`,
        );

        if (!response.ok) {
          console.warn(
            `⚠️ [USER TOKEN BALANCE HOOK] API request failed - status: ${response.status}`,
          );
          const errorData: UserTokenBalanceError = await response.json();

          if (errorData.fallback) {
            console.log(
              `⚠️ [USER TOKEN BALANCE HOOK] Using fallback data (balance: 0)`,
            );
            // Show fallback - user has no tokens or API failed
            setBalance(0);
            setError(null);
          } else {
            console.error(
              `❌ [USER TOKEN BALANCE HOOK] API error: ${errorData.error}`,
            );
            throw new Error(errorData.error || "Failed to fetch token balance");
          }
          return;
        }

        const data: UserTokenBalanceResponse = await response.json();
        console.log(
          `✅ [USER TOKEN BALANCE HOOK] Successfully received token balance: ${data.balance} for talentUuid: ${talentUuid}`,
        );
        setBalance(data.balance);
      } catch (err) {
        console.error(
          "❌ [USER TOKEN BALANCE HOOK] Error fetching user token balance:",
          err,
        );
        setError(
          err instanceof Error ? err.message : "Failed to fetch token balance",
        );
        // Show fallback on error
        console.log(`⚠️ [USER TOKEN BALANCE HOOK] Setting fallback balance: 0`);
        setBalance(0);
      } finally {
        console.log(
          `🔄 [USER TOKEN BALANCE HOOK] Token balance fetch completed for talentUuid: ${talentUuid}`,
        );
        setLoading(false);
      }
    }

    fetchTokenBalance();
  }, [talentUuid]);

  return { balance, loading, error };
}

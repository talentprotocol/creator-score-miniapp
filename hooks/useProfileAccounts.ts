import { useState, useEffect, useCallback } from "react";
import type { SocialAccount, GroupedWalletAccounts } from "@/lib/types";

export interface ProfileAccountsData {
  social: SocialAccount[];
  wallet: GroupedWalletAccounts;
  primaryWalletInfo: {
    main_wallet_address: string | null;
    farcaster_primary_wallet_address: string | null;
  };
}

export function useProfileAccounts(talentUUID: string | undefined) {
  const [data, setData] = useState<ProfileAccountsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const fetchAccountsData = useCallback(async () => {
    if (!talentUUID) return;

    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/accounts?id=${talentUUID}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const accountsData = await response.json();
      setData(accountsData);
      setError(undefined);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch accounts data",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [talentUUID]);

  useEffect(() => {
    fetchAccountsData();
  }, [fetchAccountsData]);

  return {
    data,
    loading,
    error,
    refetch: fetchAccountsData,
    // Convenience accessors for backward compatibility
    social: data?.social || [],
    wallet: data?.wallet || { farcasterVerified: [], talentVerified: [] },
    primaryWalletInfo: data?.primaryWalletInfo || {
      main_wallet_address: null,
      farcaster_primary_wallet_address: null,
    },
  };
}

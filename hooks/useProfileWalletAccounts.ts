import { useState, useEffect, useCallback } from "react";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { getWalletAccountsForTalentId } from "@/app/services/walletAccountsService";
import type { GroupedWalletAccounts } from "@/app/services/types";
import { CACHE_KEYS } from "@/lib/cache-keys";

export function useProfileWalletAccounts(talentUUID: string | undefined) {
  const [walletData, setWalletData] = useState<GroupedWalletAccounts | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const fetchWalletData = useCallback(async () => {
    if (!talentUUID) return;

    const cacheKey = `${CACHE_KEYS.PROFILE_WALLET_ACCOUNTS}_${talentUUID}`;

    // Check cache first
    const cachedData = getCachedData<GroupedWalletAccounts>(
      cacheKey,
      CACHE_DURATIONS.PROFILE_DATA,
    );
    if (cachedData) {
      setWalletData(cachedData);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const data = await getWalletAccountsForTalentId(talentUUID);
      setWalletData(data);
      setError(undefined);

      // Cache the wallet data
      setCachedData(cacheKey, data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch wallet data",
      );
      setWalletData(null);
    } finally {
      setLoading(false);
    }
  }, [talentUUID]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  return { walletData, loading, error, refetch: fetchWalletData };
}

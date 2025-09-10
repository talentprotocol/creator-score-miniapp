import { useState, useEffect, useCallback } from "react";
import type { GroupedWalletAccounts } from "@/lib/types";

export function useProfileWalletAccounts(talentUUID: string | undefined) {
  const [walletData, setWalletData] = useState<GroupedWalletAccounts | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const fetchWalletData = useCallback(async () => {
    if (!talentUUID) return;

    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/talent-accounts?id=${talentUUID}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setWalletData(data);
      setError(undefined);
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

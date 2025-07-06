import { useState, useEffect } from "react";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import {
  getUserWalletAddresses,
  type UserWalletAddresses,
} from "@/app/services/neynarService";

export function useProfileWalletAddresses(fid: number | string | undefined) {
  const [walletData, setWalletData] = useState<UserWalletAddresses | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const fetchWalletData = async () => {
    if (!fid) return;

    const cacheKey = `wallet_addresses_${fid}`;

    // Check cache first
    const cachedData = getCachedData<UserWalletAddresses>(
      cacheKey,
      CACHE_DURATIONS.PROFILE_DATA,
    );
    if (cachedData) {
      setWalletData(cachedData);
      setError(cachedData.error);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      let fidParam;
      if (typeof fid === "number") {
        fidParam = fid;
      } else if (typeof fid === "string" && !isNaN(Number(fid))) {
        fidParam = Number(fid);
      } else {
        setWalletData(null);
        setError(undefined);
        return;
      }

      const data = await getUserWalletAddresses(fidParam);

      setWalletData(data);
      setError(data.error);

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
  };

  useEffect(() => {
    fetchWalletData();
  }, [fid]);

  return { walletData, loading, error, refetch: fetchWalletData };
}

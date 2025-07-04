import { useState, useEffect } from "react";
import {
  getUserWalletAddresses,
  type UserWalletAddresses,
} from "@/app/services/neynarService";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";

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
      let data;
      if (typeof fid === "number") {
        data = await getUserWalletAddresses(fid);
      } else if (typeof fid === "string" && !isNaN(Number(fid))) {
        data = await getUserWalletAddresses(Number(fid));
      } else {
        setWalletData(null);
        setError(undefined);
        return;
      }
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

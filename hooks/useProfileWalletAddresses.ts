import { useState, useEffect } from "react";
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

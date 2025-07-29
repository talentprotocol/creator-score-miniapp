import { useState, useEffect } from "react";
import {
  getEthUsdcPrice,
  convertEthToUsdc,
  getCachedData,
  setCachedData,
  CACHE_DURATIONS,
  formatNumberWithSuffix,
} from "@/lib/utils";
import { isEarningsCredential } from "@/lib/total-earnings-config";
import { useProfileCredentials } from "./useProfileCredentials";

export function useProfileTotalEarnings(talentUUID: string) {
  const [totalEarnings, setTotalEarnings] = useState<number | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived formatted value
  const formattedTotalEarnings =
    totalEarnings !== undefined
      ? formatNumberWithSuffix(totalEarnings)
      : undefined;

  // Use the existing credentials hook instead of making our own API call
  const {
    credentials: credentialsGroups,
    loading: credentialsLoading,
    error: credentialsError,
  } = useProfileCredentials(talentUUID);

  useEffect(() => {
    async function calculateEarnings() {
      if (!talentUUID) {
        setLoading(false);
        return;
      }

      // Wait for credentials to load
      if (credentialsLoading) {
        setLoading(true);
        return;
      }

      // Handle credentials error
      if (credentialsError) {
        setError(credentialsError);
        setTotalEarnings(undefined);
        setLoading(false);
        return;
      }

      // Check cache first
      const cacheKey = `total_earnings_${talentUUID}_v0`;
      console.log("[useProfileTotalEarnings] cacheKey", cacheKey);
      const cachedEarnings = getCachedData<number>(
        cacheKey,
        CACHE_DURATIONS.PROFILE_DATA,
      );
      if (cachedEarnings !== null) {
        setTotalEarnings(cachedEarnings);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Match earnings calculation logic used in app/[identifier]/layout.tsx
        const ethPrice = await getEthUsdcPrice();

        const issuerTotals = new Map<string, number>();

        credentialsGroups.forEach((credentialGroup) => {
          // Check if this group contains any earnings-related credentials
          const hasEarningsCredentials = credentialGroup.points.some((point) =>
            isEarningsCredential(point.slug || ""),
          );

          if (!hasEarningsCredentials) return;

          let issuerTotal = 0;

          credentialGroup.points.forEach((point) => {
            if (!isEarningsCredential(point.slug || "")) return;
            if (!point.readable_value || !point.uom) return;

            const cleanValue = point.readable_value;
            const numericValue = cleanValue.replace(/[^0-9.KM-]+/g, "");

            let value: number;
            if (numericValue.includes("K")) {
              value = parseFloat(numericValue.replace("K", "")) * 1000;
            } else if (numericValue.includes("M")) {
              value = parseFloat(numericValue.replace("M", "")) * 1000000;
            } else {
              value = parseFloat(numericValue);
            }

            if (isNaN(value)) return;

            let usdValue = 0;
            if (point.uom === "ETH") {
              usdValue = convertEthToUsdc(value, ethPrice);
            } else if (point.uom === "USDC") {
              usdValue = value;
            }

            issuerTotal += usdValue;
          });

          if (issuerTotal > 0) {
            issuerTotals.set(credentialGroup.issuer, issuerTotal);
          }
        });

        const total = Array.from(issuerTotals.values()).reduce(
          (sum, value) => sum + value,
          0,
        );

        setTotalEarnings(total);

        // Cache the total earnings
        setCachedData(cacheKey, total);
      } catch (err) {
        console.error("Error calculating total earnings:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to calculate total earnings",
        );
        setTotalEarnings(undefined); // Use undefined to indicate error, not 0
      } finally {
        setLoading(false);
      }
    }

    calculateEarnings();
  }, [talentUUID, credentialsGroups, credentialsLoading, credentialsError]);

  return { totalEarnings, formattedTotalEarnings, loading, error };
}

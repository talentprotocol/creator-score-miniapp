import { useState, useEffect } from "react";
import {
  calculateTotalRewards,
  getEthUsdcPrice,
  getCachedData,
  setCachedData,
  CACHE_DURATIONS,
} from "@/lib/utils";
import { useProfileCredentials } from "./useProfileCredentials";

export function useProfileTotalEarnings(talentUUID: string) {
  const [totalEarnings, setTotalEarnings] = useState<number | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const cacheKey = `total_earnings_${talentUUID}`;
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

        // Transform grouped credentials into the structure expected by calculateTotalRewards
        const credentials = credentialsGroups.flatMap((group) =>
          group.points.map((point) => ({
            name: point.label,
            slug: point.slug,
            points_calculation_logic: {
              data_points: [
                {
                  value: `${point.readable_value} ${point.uom}`, // Reconstruct original value with currency
                  readable_value: point.readable_value,
                  uom: point.uom,
                },
              ],
            },
          })),
        );

        const total = await calculateTotalRewards(credentials, getEthUsdcPrice);

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

  return { totalEarnings, loading, error };
}

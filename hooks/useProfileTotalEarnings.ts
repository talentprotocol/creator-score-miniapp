import { useState, useEffect } from "react";
import {
  calculateTotalRewards,
  getEthUsdcPrice,
  getCachedData,
  setCachedData,
  CACHE_DURATIONS,
} from "@/lib/utils";
import { getCredentialsForTalentId } from "@/app/services/credentialsService";

export function useProfileTotalEarnings(talentUUID: string) {
  const [totalEarnings, setTotalEarnings] = useState<number | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTotalEarnings() {
      const cacheKey = `total_earnings_${talentUUID}`;

      // Check cache first
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

        const credentialsGroups = await getCredentialsForTalentId(talentUUID);

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
        console.error("Error fetching total earnings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch total earnings",
        );
        setTotalEarnings(undefined); // Use undefined to indicate error, not 0
      } finally {
        setLoading(false);
      }
    }

    if (talentUUID) {
      fetchTotalEarnings();
    }
  }, [talentUUID]);

  return { totalEarnings, loading, error };
}

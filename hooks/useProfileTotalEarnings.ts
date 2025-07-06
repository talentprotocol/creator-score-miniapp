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
  const [totalEarnings, setTotalEarnings] = useState<number | null>(null);
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

        // Flatten the grouped credentials back to individual credentials for calculation
        const credentials = credentialsGroups.flatMap((group) =>
          group.points.map((point) => ({
            name: point.label,
            slug: point.slug,
            points: point.value,
            max_score: point.max_score,
            readable_value: point.readable_value,
            uom: point.uom,
            external_url: point.external_url,
            data_issuer_name: group.issuer,
          })),
        );

        console.log("[Total Earnings Debug] Credentials:", credentials);
        const total = await calculateTotalRewards(credentials, getEthUsdcPrice);
        console.log("[Total Earnings Debug] Calculated total:", total);

        setTotalEarnings(total);

        // Cache the total earnings
        setCachedData(cacheKey, total);
      } catch (err) {
        console.error("Error fetching total earnings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch total earnings",
        );
        setTotalEarnings(null); // Use null to indicate error, not 0
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

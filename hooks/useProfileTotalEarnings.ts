import { useState, useEffect } from "react";
import {
  getCredentialsForTalentId,
  type IssuerCredentialGroup,
} from "@/app/services/talentService";
import {
  calculateTotalRewards,
  getEthUsdcPrice,
  getCachedData,
  setCachedData,
  CACHE_DURATIONS,
} from "@/lib/utils";

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
        console.log(
          `[useProfileTotalEarnings] Using cached earnings for ${talentUUID}:`,
          cachedEarnings,
        );
        setTotalEarnings(cachedEarnings);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(
          `[useProfileTotalEarnings] Fetching credentials for ${talentUUID}`,
        );
        const credentials = await getCredentialsForTalentId(talentUUID);
        const total = await calculateTotalRewards(credentials, getEthUsdcPrice);

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

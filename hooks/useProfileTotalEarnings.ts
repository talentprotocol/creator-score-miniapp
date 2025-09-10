import { useState, useEffect } from "react";
import {
  formatNumberWithSuffix,
  calculateTotalRewards,
  getEthUsdcPrice,
} from "@/lib/utils";
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

      try {
        setLoading(true);
        setError(null);

        // Transform credentials to match calculateTotalRewards signature
        const transformedCredentials = credentialsGroups.flatMap((group) =>
          group.points.map((point) => ({
            slug: point.slug,
            readable_value: point.readable_value,
            uom: point.uom,
          })),
        );

        // Use the shared calculateTotalRewards function for consistent earnings calculation
        const total = await calculateTotalRewards(
          transformedCredentials,
          getEthUsdcPrice,
        );

        setTotalEarnings(total);
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

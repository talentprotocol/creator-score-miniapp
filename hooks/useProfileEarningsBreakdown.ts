import { useState, useEffect } from "react";
import { useProfileCredentials } from "./useProfileCredentials";
import { getEthUsdcPrice, convertEthToUsdc, getPolUsdPrice, convertPolToUsdc } from "@/lib/utils";
import { isEarningsCredential } from "@/lib/total-earnings-config";

interface EarningsBreakdownSegment {
  name: string;
  value: number;
  percentage: number;
}

interface EarningsBreakdown {
  totalEarnings: number;
  segments: EarningsBreakdownSegment[];
}

export function useProfileEarningsBreakdown(talentUUID: string) {
  const {
    credentials,
    loading: credentialsLoading,
    error: credentialsError,
  } = useProfileCredentials(talentUUID);
  const [breakdown, setBreakdown] = useState<EarningsBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function calculateEarningsBreakdown() {
      if (!credentials || credentials.length === 0) {
        setBreakdown(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [ethPrice, polPrice] = await Promise.all([
          getEthUsdcPrice(),
          getPolUsdPrice(),
        ]);
        const issuerTotals = new Map<string, number>();

        // Process each credential group
        credentials.forEach((credentialGroup) => {
          // Check if any point in this group is earnings-related
          const hasEarningsCredentials = credentialGroup.points.some((point) =>
            isEarningsCredential(point.slug || ""),
          );

          if (!hasEarningsCredentials) {
            return;
          }

          let issuerTotal = 0;

          // Calculate total for this issuer
          credentialGroup.points.forEach((point) => {
            if (!isEarningsCredential(point.slug || "")) {
              return;
            }

            if (!point.readable_value || !point.uom) {
              return;
            }

            // Parse the value
            const cleanValue = point.readable_value;
            let value: number;
            const numericValue = cleanValue.replace(/[^0-9.KM-]+/g, "");

            if (numericValue.includes("K")) {
              value = parseFloat(numericValue.replace("K", "")) * 1000;
            } else if (numericValue.includes("M")) {
              value = parseFloat(numericValue.replace("M", "")) * 1000000;
            } else {
              value = parseFloat(numericValue);
            }

            if (isNaN(value)) {
              return;
            }

            // Convert to USD
            let usdValue = 0;
            if (point.uom === "ETH") {
              usdValue = convertEthToUsdc(value, ethPrice);
            } else if (point.uom === "POL") {
              usdValue = convertPolToUsdc(value, polPrice);
            } else if (point.uom === "USDC") {
              usdValue = value;
            }

            issuerTotal += usdValue;
          });

          if (issuerTotal > 0) {
            issuerTotals.set(credentialGroup.issuer, issuerTotal);
          }
        });

        // Convert to array and sort by value
        const sortedIssuers = Array.from(issuerTotals.entries()).sort(
          ([, a], [, b]) => b - a,
        );

        // Calculate total earnings
        const totalEarnings = sortedIssuers.reduce(
          (sum, [, value]) => sum + value,
          0,
        );

        if (totalEarnings === 0) {
          setBreakdown({
            totalEarnings: 0,
            segments: [],
          });
          setLoading(false);
          return;
        }

        // Take top 5 and group the rest as "Other"
        const top5 = sortedIssuers.slice(0, 5);
        const others = sortedIssuers.slice(5);
        const otherTotal = others.reduce((sum, [, value]) => sum + value, 0);

        const segments: EarningsBreakdownSegment[] = top5.map(
          ([issuer, value]) => ({
            name: issuer,
            value,
            percentage: (value / totalEarnings) * 100,
          }),
        );

        if (otherTotal > 0) {
          segments.push({
            name: "Other",
            value: otherTotal,
            percentage: (otherTotal / totalEarnings) * 100,
          });
        }

        const result = {
          totalEarnings,
          segments,
        };

        setBreakdown(result);
      } catch (err) {
        console.error("Error calculating earnings breakdown:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to calculate earnings breakdown",
        );
        setBreakdown(null);
      } finally {
        setLoading(false);
      }
    }

    if (!credentialsLoading && !credentialsError) {
      calculateEarningsBreakdown();
    }
  }, [credentials, credentialsLoading, credentialsError, talentUUID]);

  return {
    breakdown,
    loading: loading || credentialsLoading,
    error: error || credentialsError,
  };
}

"use client";

import * as React from "react";
import type { IssuerCredentialGroup, Credential } from "@/app/services/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";

// Transform individual credentials to IssuerCredentialGroup format
function transformCredentialsToGroups(
  credentials: Credential[],
): IssuerCredentialGroup[] {
  const issuerMap = new Map<string, IssuerCredentialGroup>();

  credentials.forEach((credential) => {
    const issuer = credential.data_issuer_name;

    if (!issuerMap.has(issuer)) {
      issuerMap.set(issuer, {
        issuer,
        total: 0,
        max_total: 0,
        points: [],
      });
    }

    const issuerGroup = issuerMap.get(issuer)!;

    // Add this credential as a point
    issuerGroup.points.push({
      label: credential.name,
      slug: credential.slug,
      value: credential.points,
      max_score: credential.max_score,
      readable_value: credential.readable_value,
      uom: credential.uom,
      external_url: credential.external_url,
    });

    // Update totals
    issuerGroup.total += credential.points;
    issuerGroup.max_total += credential.max_score;
  });

  return Array.from(issuerMap.values());
}

export function useProfileCredentials(talentUUID: string) {
  const [credentials, setCredentials] = React.useState<IssuerCredentialGroup[]>(
    [],
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchCredentials() {
      if (!talentUUID) return;

      try {
        setLoading(true);
        setError(null);

        const cacheKey = `credentials-${talentUUID}`;
        const cached = getCachedData<IssuerCredentialGroup[]>(
          cacheKey,
          CACHE_DURATIONS.PROFILE_DATA,
        );

        if (cached) {
          setCredentials(cached);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/talent-credentials?uuid=${talentUUID}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();

        // Extract the credentials array from the response object
        const individualCredentials = responseData.credentials || [];

        // Transform individual credentials to IssuerCredentialGroup format
        const transformedCredentials = transformCredentialsToGroups(
          individualCredentials,
        );
        setCredentials(transformedCredentials);

        // Cache the credentials data for 5 minutes (the transformed array)
        setCachedData(cacheKey, transformedCredentials);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch credentials",
        );
        setCredentials([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCredentials();
  }, [talentUUID]);

  return { credentials, loading, error };
}

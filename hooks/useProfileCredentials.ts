"use client";

import * as React from "react";
import type { IssuerCredentialGroup } from "@/app/services/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";

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
        const data = responseData.credentials || [];
        setCredentials(data);

        // Cache the credentials data for 5 minutes (the extracted array)
        setCachedData(cacheKey, data);
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

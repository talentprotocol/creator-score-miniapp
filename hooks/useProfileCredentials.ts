"use client";

import * as React from "react";
import type { IssuerCredentialGroup } from "@/app/services/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { getCredentialsForTalentId } from "@/app/services/credentialsService";

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

        const credentialsData = await getCredentialsForTalentId(talentUUID);

        setCredentials(credentialsData);

        // Cache the credentials data
        setCachedData(cacheKey, credentialsData);
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

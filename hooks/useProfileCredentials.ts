"use client";

import * as React from "react";
import type { IssuerCredentialGroup } from "@/lib/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { getCredentialsForTalentId } from "@/app/services/credentialsService";
import { CACHE_KEYS } from "@/lib/cache-keys";

export function useProfileCredentials(talentUUID: string) {
  const [credentials, setCredentials] = React.useState<IssuerCredentialGroup[]>(
    [],
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCredentials = React.useCallback(async () => {
    if (!talentUUID) return;

    try {
      setLoading(true);
      setError(null);

      const cacheKey = `${CACHE_KEYS.PROFILE_CREDENTIALS}_${talentUUID}`;
      const cached = getCachedData<IssuerCredentialGroup[]>(
        cacheKey,
        CACHE_DURATIONS.CREDENTIALS_DATA,
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
  }, [talentUUID]);

  React.useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  return { credentials, loading, error };
}

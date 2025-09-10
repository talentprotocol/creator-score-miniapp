"use client";

import * as React from "react";
import type { IssuerCredentialGroup, CredentialsResponse } from "@/lib/types";
import { groupCredentialsByIssuer } from "@/lib/credential-utils";

export function useProfileCredentials(talentUUID: string) {
  const [credentials, setCredentials] = React.useState<IssuerCredentialGroup[]>(
    [],
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!talentUUID) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/talent-credentials?id=${talentUUID}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: CredentialsResponse | { error: string }) => {
        // Transform raw API response to grouped format using shared logic
        if ("error" in data) {
          setCredentials([]);
          return;
        }

        if (!Array.isArray(data.credentials)) {
          setCredentials([]);
          return;
        }

        const groupedCredentials = groupCredentialsByIssuer(data.credentials);
        setCredentials(groupedCredentials);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(
            err instanceof Error ? err.message : "Failed to fetch credentials",
          );
          setCredentials([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [talentUUID]);

  return { credentials, loading, error };
}

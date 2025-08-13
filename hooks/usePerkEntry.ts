"use client";

import * as React from "react";

type PerkStatus = "ineligible" | "open" | "entered" | "closed";

interface PerkEntryData {
  status: PerkStatus;
  enteredAt?: string | null;
  deadlineIso: string;
}

export function usePerkEntry(perkSlug: string, talentUUID?: string | null) {
  const [data, setData] = React.useState<PerkEntryData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStatus = React.useCallback(async () => {
    if (!talentUUID) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/perks/${perkSlug}?talent_uuid=${talentUUID}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch status");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [perkSlug, talentUUID]);

  const enter = React.useCallback(async () => {
    if (!talentUUID) return { ok: false } as const;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/perks/${perkSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talent_uuid: talentUUID }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to enter");
      setData(json);
      return { ok: true } as const;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return { ok: false } as const;
    } finally {
      setLoading(false);
    }
  }, [perkSlug, talentUUID]);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { data, loading, error, refresh: fetchStatus, enter };
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { resolveFidToTalentUuid } from "@/lib/user-resolver";
import type { UnifiedUserProfile } from "@/app/services/types";

type HookReturn = Omit<UnifiedUserProfile, "error"> & {
  error: string | null;
  loading: boolean;
};

export function useResolvedTalentProfile(): HookReturn {
  const { context } = useMiniKit();
  const farcasterUser = getUserContext(context);
  const { talentId } = usePrivyAuth({});

  const [talentUuid, setTalentUuid] = useState<string | null>(null);
  const [data, setData] = useState<UnifiedUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve UUID from wallet (Privy) or FID
  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      setError(null);
      // Prefer wallet path when available
      if (talentId) {
        setTalentUuid(talentId);
        return;
      }
      const fid = farcasterUser?.fid;
      if (!fid) {
        setTalentUuid(null);
        return;
      }
      try {
        const uuid = await resolveFidToTalentUuid(fid);
        if (!cancelled) setTalentUuid(uuid);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
        setTalentUuid(null);
      }
    }
    resolve();
    return () => {
      cancelled = true;
    };
  }, [talentId, farcasterUser?.fid]);

  // Fetch unified profile once we have a UUID
  useEffect(() => {
    let cancelled = false;
    async function fetchProfile(uuid: string) {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/user-profile?talentUuid=${uuid}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json: UnifiedUserProfile = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load profile");
        if (!cancelled)
          setData({
            talentUuid: uuid,
            displayName: null,
            avatarUrl: null,
            creatorScore: 0,
            lastCalculatedAt: null,
            calculating: false,
            hasTalentAccount: false,
          });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (talentUuid) fetchProfile(talentUuid);
    else setData(null);
    return () => {
      cancelled = true;
    };
  }, [talentUuid]);

  return {
    talentUuid: data?.talentUuid ?? talentUuid ?? null,
    displayName: data?.displayName ?? null,
    avatarUrl: data?.avatarUrl ?? null,
    creatorScore: data?.creatorScore ?? 0,
    lastCalculatedAt: data?.lastCalculatedAt ?? null,
    calculating: data?.calculating ?? false,
    hasTalentAccount: data?.hasTalentAccount ?? false,
    error,
    loading,
  };
}

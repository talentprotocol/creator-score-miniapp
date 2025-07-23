"use client";

import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { resolveFidToTalentUuid } from "@/lib/user-resolver";
import { usePrivyAuth } from "./usePrivyAuth";

// Session-level cache for user resolution
const userResolutionCache = new Map<number, string | null>();

export function useUserResolution() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const { talentId } = usePrivyAuth({});
  const [talentUuid, setTalentUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolveUserTalentUuid() {
      if (talentId) {
        setTalentUuid(talentId);
        setLoading(false);
        return;
      }

      if (!user?.fid) {
        setTalentUuid(null);
        setLoading(false);
        return;
      }

      // Check session cache first
      if (userResolutionCache.has(user.fid)) {
        setTalentUuid(userResolutionCache.get(user.fid) || null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const uuid = await resolveFidToTalentUuid(user.fid);

        // Cache the result
        userResolutionCache.set(user.fid, uuid);

        setTalentUuid(uuid);
      } catch (err) {
        console.error("Error resolving user talent UUID:", err);
        setError(err instanceof Error ? err.message : "Failed to resolve user");
        setTalentUuid(null);

        // Cache null result to avoid repeated failed attempts
        userResolutionCache.set(user.fid, null);
      } finally {
        setLoading(false);
      }
    }

    resolveUserTalentUuid();
  }, [user?.fid]);

  return { talentUuid, loading, error };
}

// Utility function to clear cache (useful for testing or manual refresh)
export function clearUserResolutionCache() {
  userResolutionCache.clear();
}

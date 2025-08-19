"use client";

import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { resolveFidToTalentUuid } from "@/lib/user-resolver";
import { usePrivyAuth } from "./usePrivyAuth";

// Session-level cache for user resolution to avoid repeated API calls
// Maps user identifiers (fid, wallet, etc.) to Talent Protocol UUID
const userResolutionCache = new Map<number, string | null>();

/**
 * Hook to resolve and cache a user's Talent Protocol UUID from multiple sources
 *
 * This hook handles the conversion from various user identifiers to Talent Protocol UUID
 * with intelligent caching to minimize API calls. It first checks if the user
 * already has a talentId from Privy auth, then falls back to resolving via other
 * identifiers (Farcaster ID, wallet address, etc.) through the talent-user API.
 *
 * @returns {Object} Object containing:
 *   - talentUuid: The resolved Talent Protocol UUID or null if not found
 *   - loading: Boolean indicating if resolution is in progress
 *   - error: Error message if resolution failed, null otherwise
 */
export function useFidToTalentUuid() {
  // Get the current MiniKit context and user information
  const { context } = useMiniKit();
  const user = getUserContext(context);

  // Check if user already has a talentId from Privy authentication
  const { talentId, ready: privyReady } = usePrivyAuth({});

  // State for the resolved talent UUID, loading state, and any errors
  const [talentUuid, setTalentUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Main resolution logic: Determines the user's Talent Protocol UUID
     * Priority order: Wait for Privy readiness → talentId from Privy > cached result > API resolution via fid
     */
    async function resolveUserTalentUuid() {
      // Always wait for Privy SDK to be ready before deciding auth state
      if (!privyReady) {
        setLoading(true);
        return;
      }

      // Case 1: User already has a talentId from Privy auth (highest priority)
      if (talentId) {
        setTalentUuid(talentId);
        setLoading(false);
        return;
      }

      // Case 2: No Farcaster ID available, can't resolve via this method
      if (!user?.fid) {
        setTalentUuid(null);
        setLoading(false);
        return;
      }

      // Case 3: Check session cache for previously resolved results
      if (userResolutionCache.has(user.fid)) {
        const cachedUuid = userResolutionCache.get(user.fid) || null;
        setTalentUuid(cachedUuid);
        setLoading(false);
        return;
      }

      // Case 4: Need to resolve via API - set loading state
      setLoading(true);
      setError(null);

      try {
        // Call the external resolver to convert fid to Talent Protocol UUID
        // Note: The underlying API can actually resolve from multiple identifier types
        const uuid = await resolveFidToTalentUuid(user.fid);

        // Cache the successful result for future use
        userResolutionCache.set(user.fid, uuid);

        setTalentUuid(uuid);
      } catch (err) {
        console.error("Error resolving user talent UUID:", err);

        // Set error state and clear any previous UUID
        setError(err instanceof Error ? err.message : "Failed to resolve user");
        setTalentUuid(null);

        // Cache null result to prevent repeated failed API calls for the same fid
        userResolutionCache.set(user.fid, null);
      } finally {
        // Always clear loading state, regardless of success/failure
        setLoading(false);
      }
    }

    // Execute resolution whenever fid, privy readiness, or talentId changes
    resolveUserTalentUuid();
  }, [user?.fid, talentId, privyReady]);

  return { talentUuid, loading, error };
}

/**
 * Utility function to clear the user resolution cache
 * Useful for testing, manual refresh, or when cache invalidation is needed
 */
export function clearUserResolutionCache() {
  userResolutionCache.clear();
}

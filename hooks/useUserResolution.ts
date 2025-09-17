"use client";

import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { resolveFidToTalentUuid } from "@/lib/user-resolver";
import { usePrivyAuth } from "./usePrivyAuth";

// Session-level cache for user resolution to avoid repeated API calls
// Maps user identifiers (fid, wallet, etc.) to Talent Protocol UUID
const userResolutionCache = new Map<number, string | null>();

// Cache for user handles to avoid repeated API calls
const userHandleCache = new Map<string, string | null>();

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
 *   - handle: The user's Farcaster handle or null if not found
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
  const [handle, setHandle] = useState<string | null>(null);

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

        // For Privy users, fetch handle from accounts API
        await fetchUserHandle(talentId);

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

        // If we have a cached UUID, also fetch the handle
        if (cachedUuid) {
          await fetchUserHandle(cachedUuid);
        }

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

        // If we got a UUID, fetch the handle
        if (uuid) {
          await fetchUserHandle(uuid);
        }
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

    /**
     * Fetch user's Farcaster handle from accounts API
     */
    async function fetchUserHandle(uuid: string) {
      // Check cache first
      if (userHandleCache.has(uuid)) {
        const cachedHandle = userHandleCache.get(uuid);
        setHandle(cachedHandle || null);
        return;
      }

      try {
        const response = await fetch(`/api/accounts?id=${uuid}`);
        if (response.ok) {
          const data = await response.json();

          // Extract Farcaster handle from the response
          // The accounts API returns social accounts in data.social array
          const farcasterAccount = data.social?.find(
            (social: any) => social.source === "farcaster",
          );

          // The handle field already includes the @ prefix for farcaster
          const userHandle = farcasterAccount?.handle || null;

          // Cache the result
          userHandleCache.set(uuid, userHandle);
          setHandle(userHandle);
        } else {
          console.warn("Failed to fetch user handle from accounts API");
          setHandle(null);
        }
      } catch (err) {
        console.warn("Error fetching user handle:", err);
        setHandle(null);
      }
    }

    // Execute resolution whenever fid, privy readiness, or talentId changes
    resolveUserTalentUuid();
  }, [user?.fid, talentId, privyReady]);

  // For MiniKit users, prioritize the context username over the fetched handle
  const finalHandle = user?.username || handle || null;

  return {
    talentUuid,
    loading,
    error,
    // Return the handle from MiniKit context if available, otherwise use fetched handle
    handle: finalHandle,
  };
}

/**
 * Utility function to clear the user resolution cache
 * Useful for testing, manual refresh, or when cache invalidation is needed
 */
export function clearUserResolutionCache() {
  userResolutionCache.clear();
  userHandleCache.clear();
}

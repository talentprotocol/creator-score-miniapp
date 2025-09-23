"use client";

import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { resolveFidToTalentUuid } from "@/lib/user-resolver";
import { usePrivyAuth } from "./usePrivyAuth";
import { useTalentAuthToken } from "./useTalentAuthToken";
import { getFarcasterEthereumProvider } from "@/lib/client/miniapp";

// Session-level cache for user resolution to avoid repeated API calls
// Maps user identifiers (fid, wallet, etc.) to Talent Protocol UUID
const userResolutionCache = new Map<string, string | null>();

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
  const { token: tpToken } = useTalentAuthToken();

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
      // Wait for Privy only if we don't already have a token or stored id
      if (!privyReady) {
        const storedId =
          (typeof window !== "undefined" &&
            localStorage.getItem("talentUserId")) ||
          null;
        if (!tpToken && !storedId) {
          setLoading(true);
          return;
        }
      }

      // Case 1: User already has a talentId from Privy auth (highest priority)
      if (talentId) {
        setTalentUuid(talentId);

        // For Privy users, fetch handle from accounts API
        await fetchUserHandle(talentId);

        setLoading(false);
        return;
      }

      // Case 1b: If we have a valid Talent auth token, try to decode UUID from it (JWT payload)
      if (tpToken) {
        try {
          const parts = tpToken.split(".");
          if (parts.length === 3) {
            const base64url = parts[1];
            const base64 =
              base64url.replace(/-/g, "+").replace(/_/g, "/") +
              "==".slice(0, (4 - (base64url.length % 4)) % 4);
            const json =
              typeof window !== "undefined"
                ? atob(base64)
                : Buffer.from(base64, "base64").toString("utf8");
            const payload = JSON.parse(json || "{}");
            const maybeId: string | null =
              (payload?.user && (payload.user.id || payload.user.uuid)) ||
              payload?.user_id ||
              payload?.uuid ||
              payload?.sub ||
              payload?.id ||
              null;
            const isUuid =
              typeof maybeId === "string" &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                maybeId,
              );
            if (isUuid) {
              setTalentUuid(maybeId);
              try {
                if (typeof window !== "undefined")
                  localStorage.setItem("talentUserId", maybeId);
              } catch {}
              await fetchUserHandle(maybeId);
              setLoading(false);
              return;
            }
          }
        } catch {}

        // Fallback: derive UUID via wallet address using available providers
        try {
          let address: string | null = null;
          // Try Farcaster provider first
          try {
            const fcProvider = await getFarcasterEthereumProvider();
            if (fcProvider && typeof fcProvider.request === "function") {
              const accounts = (await fcProvider.request({
                method: "eth_accounts",
              })) as string[] | undefined;
              address = accounts?.[0] || null;
            }
          } catch {}
          // Try injected provider
          if (!address && typeof window !== "undefined") {
            const injected = (window as any).ethereum;
            if (injected && typeof injected.request === "function") {
              try {
                const accounts = (await injected.request({
                  method: "eth_accounts",
                })) as string[] | undefined;
                address = accounts?.[0] || null;
              } catch {}
            }
          }
          if (address) {
            const resp = await fetch(`/api/talent-user?id=${address}`);
            if (resp.ok) {
              const data = await resp.json();
              const uuid = data?.id as string | undefined;
              if (uuid) {
                setTalentUuid(uuid);
                try {
                  if (typeof window !== "undefined")
                    localStorage.setItem("talentUserId", uuid);
                } catch {}
                await fetchUserHandle(uuid);
                setLoading(false);
                return;
              }
            }
          }
        } catch {}
      }

      // Case 2: If no Privy ID and no Farcaster fid, fall back to stored talentUserId (from wallet login)
      if (!user?.fid) {
        try {
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem("talentUserId");
            if (stored && stored.trim()) {
              setTalentUuid(stored);
              await fetchUserHandle(stored);
              setLoading(false);
              return;
            }
          }
        } catch {}
        setTalentUuid(null);
        setLoading(false);
        return;
      }

      // Case 3: Use Farcaster username when available; otherwise FID to resolve to Talent UUID
      if (user.fid) {
        try {
          const resp = await fetch(
            user.username
              ? `/api/talent-user?username=${encodeURIComponent(user.username)}`
              : `/api/talent-user?id=${encodeURIComponent(user.fid.toString())}`,
          );
          if (resp.ok) {
            const data = await resp.json();
            const uuid = data?.id as string | undefined;
            if (uuid) {
              setTalentUuid(uuid);
              // Cache the result using FID as key
              userResolutionCache.set(user.fid.toString(), uuid);
              try {
                if (typeof window !== "undefined")
                  localStorage.setItem("talentUserId", uuid);
              } catch {}
              await fetchUserHandle(uuid);
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error(
            "[useFidToTalentUuid] Error resolving FID:",
            error,
          );
        }
      }

      // Case 4: Check session cache for previously resolved results (fallback)
      if (user.fid && userResolutionCache.has(user.fid.toString())) {
        const cachedUuid = userResolutionCache.get(user.fid.toString()) || null;
        setTalentUuid(cachedUuid);

        // If we have a cached UUID, also fetch the handle
        if (cachedUuid) {
          await fetchUserHandle(cachedUuid);
        }

        setLoading(false);
        return;
      }

      // Case 5: No username available - cannot resolve
      setTalentUuid(null);
      setLoading(false);
      return;
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

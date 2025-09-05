"use client";

import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";
import { useTalentAuthToken } from "./useTalentAuthToken";

const getInitialTalentUserId = () => {
  if (typeof window !== "undefined") {
    const id = localStorage.getItem("talentUserId");
    return id || null;
  }
  return null;
};

// Global state to prevent multiple simultaneous API calls and ensure consistent state
const globalTalentUserCache = new Map<
  string,
  { id: string; timestamp: number }
>();
let globalFetchingPromise: Promise<any> | null = null;
const globalDebounceTimer = { current: null as NodeJS.Timeout | null };

// Global singleton state for talentUserId
let globalTalentUserId: string | null = getInitialTalentUserId();
const globalStateListeners = new Set<(id: string | null) => void>();

// Function to update global state and notify all listeners
function setGlobalTalentUserId(id: string | null) {
  globalTalentUserId = id;
  globalStateListeners.forEach((listener) => listener(id));
}

// Hook to subscribe to global talent user ID
function useGlobalTalentUserId() {
  const [localState, setLocalState] = useState(globalTalentUserId);

  useEffect(() => {
    const listener = (id: string | null) => setLocalState(id);
    globalStateListeners.add(listener);

    // Sync with current global state
    setLocalState(globalTalentUserId);

    return () => {
      globalStateListeners.delete(listener);
    };
  }, []);

  return localState;
}

// Cache duration: 5 minutes
const CACHE_DURATION = CACHE_DURATION_5_MINUTES * 1000; // Convert to milliseconds

async function fetchTalentUser(walletAddress: string): Promise<{ id: string }> {
  // Check cache first
  const cached = globalTalentUserCache.get(walletAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { id: cached.id };
  }

  // If already fetching, return the existing promise
  if (globalFetchingPromise) {
    return globalFetchingPromise;
  }

  globalFetchingPromise = fetch(`/api/talent-user?id=${walletAddress}`)
    .then((response) => response.json())
    .then((data) => {
      // Cache the result
      globalTalentUserCache.set(walletAddress, {
        id: data.id,
        timestamp: Date.now(),
      });
      return data;
    })
    .finally(() => {
      globalFetchingPromise = null;
    });

  return globalFetchingPromise;
}

export const usePrivyAuth = ({
  onLoginComplete,
}: {
  onLoginComplete?: () => void;
}) => {
  const router = useRouter();
  const [fetchingTalentUser, setFetchingTalentUser] = useState(false);
  const { ready, authenticated, user: privyUser, logout } = usePrivy();
  const { ensureTalentAuthToken, clearToken } = useTalentAuthToken();

  const { login } = useLogin({
    onComplete: () => {
      if (onLoginComplete) {
        onLoginComplete();
      }
    },
  });

  // Use global state instead of local state
  const talentUserId = useGlobalTalentUserId();

  // Mirror settings behavior globally: once authenticated, ensure TP auth token
  useEffect(() => {
    if (!authenticated) return;
    void ensureTalentAuthToken();
  }, [authenticated, ensureTalentAuthToken]);

  const handleLogin = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("talentUserId");
    }
    login({ walletChainType: "ethereum-only" });
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (typeof window !== "undefined") {
        localStorage.removeItem("talentUserId");
        // Clear Talent Protocol auth data
        try {
          clearToken();
        } catch {}
        try {
          sessionStorage.removeItem("tpAuthJustIssued");
        } catch {}
      }
      setGlobalTalentUserId(null);
      router.push("/leaderboard");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const debouncedFetchUser = useCallback(async (walletAddress: string) => {
    try {
      setFetchingTalentUser(true);
      const data = await fetchTalentUser(walletAddress);

      if (typeof window !== "undefined") {
        localStorage.setItem("talentUserId", data.id);
      }
      setGlobalTalentUserId(data.id);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback to wallet address
      if (typeof window !== "undefined") {
        localStorage.setItem("talentUserId", walletAddress);
      }
      setGlobalTalentUserId(walletAddress);
    } finally {
      setFetchingTalentUser(false);
    }
  }, []);

  useEffect(() => {
    // Clear state when not authenticated
    if (!authenticated) {
      setGlobalTalentUserId(null);
      return;
    }

    const walletAddress = privyUser?.wallet?.address;
    if (!walletAddress) {
      return;
    }

    // Check if we already have this user ID
    const id = getInitialTalentUserId();
    // Only skip fetching if we have a UUID (not a wallet address)
    // UUIDs have format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const isUuid =
      id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    if (isUuid) {
      setGlobalTalentUserId(id);
      return;
    }

    // If we have a wallet address stored but no UUID, we should fetch the UUID

    // Check if already fetching to prevent redundant state updates
    if (fetchingTalentUser) {
      return;
    }

    // Clear any existing debounce timer
    if (globalDebounceTimer.current) {
      clearTimeout(globalDebounceTimer.current);
    }

    // Debounce the API call globally
    globalDebounceTimer.current = setTimeout(() => {
      if (privyUser?.wallet?.address) {
        debouncedFetchUser(privyUser.wallet.address);
      }
    }, 300);

    return () => {
      if (globalDebounceTimer.current) {
        clearTimeout(globalDebounceTimer.current);
      }
    };
  }, [
    authenticated,
    ready,
    privyUser?.wallet?.address,
    fetchingTalentUser,
    debouncedFetchUser,
  ]);

  return {
    ready,
    authenticated,
    privyUser,
    talentId: talentUserId,
    handleLogin,
    handleLogout,
  };
};

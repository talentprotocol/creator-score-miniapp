"use client";

import { useLogin, usePrivy, useWallets, useConnectWallet } from "@privy-io/react-auth";
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
  const { wallets, ready: walletsReady } = useWallets();
  const autoRequestedRef = useRef(false);
  const CONNECT_WALLET_BLOCK_KEY = "connectWalletAutoBlocked";
  const CONNECT_WALLET_ATTEMPTED_KEY = "connectWalletAutoAttempted";
  const { connectWallet } = useConnectWallet({
    onSuccess: () => {
      try {
        if (typeof window !== "undefined") sessionStorage.removeItem(CONNECT_WALLET_BLOCK_KEY);
      } catch {}
      void ensureTalentAuthToken({ force: true });
      setTimeout(() => {
        try {
          if (typeof window !== "undefined") {
            const hasToken = !!localStorage.getItem("tpAuthToken");
            const rejected = sessionStorage.getItem("tpAuthRejected") === "1";
            if (!hasToken && !rejected) {
              void ensureTalentAuthToken({ force: true });
            }
          }
        } catch {}
      }, 1000);
    },
    onError: () => {
      try {
        if (typeof window !== "undefined") sessionStorage.setItem(CONNECT_WALLET_BLOCK_KEY, "1");
      } catch {}
    },
  });
  const { ensureTalentAuthToken, clearToken } = useTalentAuthToken();

  const { login } = useLogin({
    onComplete: () => {
      if (onLoginComplete) {
        onLoginComplete();
      }
      // Immediately attempt SIWE after login completes
      try {
        autoRequestedRef.current = false;
        if (typeof window !== "undefined") {
          sessionStorage.setItem("tpAuthAutoTriggered", "1");
        }
        void ensureTalentAuthToken({ force: true });
        setTimeout(() => {
          try {
            if (typeof window !== "undefined") {
              const hasToken = !!localStorage.getItem("tpAuthToken");
              const rejected = sessionStorage.getItem("tpAuthRejected") === "1";
              if (!hasToken && !rejected) {
                void ensureTalentAuthToken({ force: true });
              }
            }
          } catch {}
        }, 1000);
      } catch {}
    },
  });

  // Use global state instead of local state
  const talentUserId = useGlobalTalentUserId();

  // Auto-request Talent Protocol auth token after Privy login, once a wallet is present
  useEffect(() => {
    if (!authenticated) return;
    if (autoRequestedRef.current) return;
    // If user has rejected signature earlier, don't auto ensure/connect
    const userRejected = (() => {
      try {
        if (typeof window !== "undefined") return sessionStorage.getItem("tpAuthRejected") === "1";
      } catch {}
      return false;
    })();
    if (userRejected) return;
    const blocked = (() => {
      try {
        if (typeof window !== "undefined") return sessionStorage.getItem(CONNECT_WALLET_BLOCK_KEY) === "1";
      } catch {}
      return false;
    })();
    if (blocked) return;
    const attempted = (() => {
      try {
        if (typeof window !== "undefined") return sessionStorage.getItem(CONNECT_WALLET_ATTEMPTED_KEY) === "1";
      } catch {}
      return false;
    })();

    const primaryAddress = (wallets && wallets[0]?.address) || privyUser?.wallet?.address;
    if (primaryAddress) {
      // Prevent repeated auto triggers if a login-complete already fired one
      const alreadyAuto = (() => {
        try { if (typeof window !== "undefined") return sessionStorage.getItem("tpAuthAutoTriggered") === "1"; } catch {}
        return false;
      })();
      autoRequestedRef.current = true;
      if (!alreadyAuto) void ensureTalentAuthToken({ force: true });
      return;
    }

    // No wallet yet – open Privy connect wallet modal once, then ensure on success
    autoRequestedRef.current = true;
    try {
      try { if (typeof window !== "undefined") sessionStorage.setItem(CONNECT_WALLET_ATTEMPTED_KEY, "1"); } catch {}
      connectWallet({ walletChainType: "ethereum-only" });
    } catch {}
  }, [authenticated, wallets && wallets[0]?.address, privyUser?.wallet?.address, ensureTalentAuthToken, connectWallet]);

  const handleLogin = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("talentUserId");
      try {
        sessionStorage.removeItem(CONNECT_WALLET_BLOCK_KEY);
        sessionStorage.removeItem(CONNECT_WALLET_ATTEMPTED_KEY);
        sessionStorage.removeItem("tpAuthRejected");
      } catch {}
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
      // Keep error for logout issues
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
      // Keep error for user data fetch issues
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
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("talentUserId");
          try {
            window.dispatchEvent(
              new CustomEvent("talentUserIdUpdated", { detail: { talentUserId: null } }),
            );
          } catch {}
        }
      } catch {}
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

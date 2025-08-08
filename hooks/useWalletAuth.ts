"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";

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

function setGlobalTalentUserId(id: string | null) {
  globalTalentUserId = id;
  globalStateListeners.forEach((listener) => listener(id));
}

function useGlobalTalentUserId() {
  const [localState, setLocalState] = useState(globalTalentUserId);
  useEffect(() => {
    const listener = (id: string | null) => setLocalState(id);
    globalStateListeners.add(listener);
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
  const cached = globalTalentUserCache.get(walletAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { id: cached.id };
  }
  if (globalFetchingPromise) {
    return globalFetchingPromise;
  }
  globalFetchingPromise = fetch(`/api/talent-user?id=${walletAddress}`)
    .then((response) => response.json())
    .then((data) => {
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

export const useWalletAuth = ({
  onLoginComplete,
}: {
  onLoginComplete?: () => void;
}) => {
  const router = useRouter();
  const [fetchingTalentUser, setFetchingTalentUser] = useState(false);
  const { address, isConnected, status } = useAccount();
  const { disconnectAsync } = useDisconnect();

  const ready = status !== "reconnecting" && status !== "connecting";
  const authenticated = isConnected;

  const talentUserId = useGlobalTalentUserId();

  const handleLogin = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("talentUserId");
    }
    // Consumers should render a Connect Wallet UI from OnchainKit; this is a placeholder.
    if (onLoginComplete) onLoginComplete();
  };

  const handleLogout = async () => {
    try {
      await disconnectAsync();
      if (typeof window !== "undefined") {
        localStorage.removeItem("talentUserId");
      }
      setGlobalTalentUserId(null);
      router.push("/leaderboard");
    } catch (error) {
      console.error("Error during disconnect:", error);
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
      if (typeof window !== "undefined") {
        localStorage.setItem("talentUserId", walletAddress);
      }
      setGlobalTalentUserId(walletAddress);
    } finally {
      setFetchingTalentUser(false);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setGlobalTalentUserId(null);
      return;
    }
    const walletAddress = address;
    if (!walletAddress) {
      return;
    }
    const id = getInitialTalentUserId();
    const isUuid =
      id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    if (isUuid) {
      setGlobalTalentUserId(id);
      return;
    }
    if (fetchingTalentUser) {
      return;
    }
    if (globalDebounceTimer.current) {
      clearTimeout(globalDebounceTimer.current);
    }
    globalDebounceTimer.current = setTimeout(() => {
      if (walletAddress) {
        debouncedFetchUser(walletAddress);
      }
    }, 300);
    return () => {
      if (globalDebounceTimer.current) {
        clearTimeout(globalDebounceTimer.current);
      }
    };
  }, [authenticated, ready, address, fetchingTalentUser, debouncedFetchUser]);

  return {
    ready,
    authenticated,
    walletAddress: address,
    talentId: talentUserId,
    handleLogin,
    handleLogout,
  };
};

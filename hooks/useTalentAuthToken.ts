"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { isFarcasterMiniAppSync } from "@/lib/utils";

type EnsureOptions = {
  enabled?: boolean;
};

// Global in-flight promise to dedupe concurrent ensure calls across components
let globalEnsurePromise: Promise<string | null> | null = null;

export function useTalentAuthToken(options: EnsureOptions = {}) {
  const { enabled = true } = options;
  const requestingRef = useRef(false);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // stage: idle | nonce | sign | exchange | rejected
  const [stage, setStage] = useState<
    "idle" | "nonce" | "sign" | "exchange" | "rejected"
  >(
    "idle",
  );

  const readFromStorage = useCallback(() => {
    if (typeof window === "undefined") return { token: null, expiresAt: null };
    const stored = localStorage.getItem("tpAuthToken");
    const storedExp = localStorage.getItem("tpAuthExpiresAt");
    return {
      token: stored || null,
      expiresAt: storedExp ? Number(storedExp) : null,
    };
  }, []);

  const saveToStorage = useCallback((t: string, exp?: number) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("tpAuthToken", t);
    if (exp) localStorage.setItem("tpAuthExpiresAt", String(exp));
    try {
      window.dispatchEvent(
        new CustomEvent("tpAuthTokenUpdated", {
          detail: { token: t, expiresAt: exp ?? null },
        }),
      );
    } catch {}
  }, []);

  const clearStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("tpAuthToken");
    localStorage.removeItem("tpAuthExpiresAt");
    try {
      window.dispatchEvent(
        new CustomEvent("tpAuthTokenUpdated", { detail: { token: null, expiresAt: null } }),
      );
    } catch {}
  }, []);

  const isExpiringSoon = useCallback((exp?: number | null) => {
    if (!exp) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    const fiveDays = 5 * 24 * 60 * 60;
    return exp - nowSec < fiveDays;
  }, []);

  // Public method to ensure token exists; prompts signing if missing
  const ensureTalentAuthToken = useCallback(async (opts?: { force?: boolean }) => {
    if (!enabled) return null;
    if (requestingRef.current) return token;
    if (globalEnsurePromise) return globalEnsurePromise;

    const runner = (async () => {
      try {
      setLoading(true);
      setError(null);
      setStage("idle");

      // If user previously rejected, avoid auto-prompt loops unless forced
      if (typeof window !== "undefined") {
        try {
          // Clear any stale flags when forced
          if (opts?.force) {
            sessionStorage.removeItem("tpAuthRejected");
            sessionStorage.removeItem("tpAuthInProgress");
          }
          const rejected = sessionStorage.getItem("tpAuthRejected") === "1";
          if (rejected && !opts?.force) {
            setStage("rejected");
            setError("Wallet signature required");
            return null;
          }
        } catch {}
      }

      const { token: existing, expiresAt: existingExp } = readFromStorage();
      if (existing && !isExpiringSoon(existingExp)) {
        setToken(existing);
        setExpiresAt(existingExp);
        return existing;
      }

      // Cross-component/session guard: avoid multiple parallel prompts
      if (typeof window !== "undefined") {
        try {
          const inProgress = sessionStorage.getItem("tpAuthInProgress");
          if (inProgress === "1" && !opts?.force) {
            // Surface clear message when a prompt is already pending
            setStage("rejected");
            setError("A wallet request is already pending. Please complete it in your wallet.");
            return null;
          }
          sessionStorage.setItem("tpAuthInProgress", "1");
        } catch {}
      }

      requestingRef.current = true;

      // 1) Get nonce - requires wallet address (and optional chain_id)
      setStage("nonce");
      // Select EIP-1193 provider based on environment
      let provider: any = undefined;
      let providerSource: "farcaster" | "privy" | "injected" | "unknown" = "unknown";
      if (typeof window !== "undefined") {
        const isMiniApp = isFarcasterMiniAppSync?.() === true;
        try {
          if (isMiniApp) {
            // Only use Farcaster provider inside the mini app
            const mod = await import("@farcaster/miniapp-sdk");
            const sdk = (mod as any)?.sdk;
            const viaGetter = sdk?.wallet?.getEthereumProvider
              ? await sdk.wallet.getEthereumProvider()
              : undefined;
            const viaLegacy = sdk?.wallet?.ethProvider;
            const farcasterProvider = viaGetter || viaLegacy;
            if (farcasterProvider && typeof farcasterProvider.request === "function") {
              provider = farcasterProvider;
              providerSource = "farcaster";
            }
          }
        } catch {}
        // Try Privy's embedded wallet provider next
        if (!provider) {
          try {
            const privyProvider = (window as any)?.privy?.getEthereumProvider
              ? await (window as any).privy.getEthereumProvider()
              : undefined;
            if (privyProvider && typeof privyProvider.request === "function") {
              provider = privyProvider;
              providerSource = "privy";
            }
          } catch {}
        }
        if (!provider) {
          // Fallback to injected provider (e.g., Privy/wallet extension)
          const injected = (window as any).ethereum;
          if (injected && typeof injected.request === "function") {
            provider = injected;
            providerSource = "injected";
          }
        }
      }

      if (!provider) {
        setStage("rejected");
        setError("No Ethereum provider available");
        return null;
      }

      let address: string | undefined;
      try {
        // Try silent fetch first
        let accounts = (await provider.request({ method: "eth_accounts" })) as
          | string[]
          | undefined;
        if (!accounts || accounts.length === 0) {
          // Prompt user to connect if not already authorized
          accounts = (await provider.request({
            method: "eth_requestAccounts",
          })) as string[] | undefined;
        }
        address = accounts?.[0];
      } catch (err: any) {
        console.error("[useTalentAuthToken] eth_accounts/eth_requestAccounts failed", {
          providerSource,
          code: err?.code ?? err?.data?.code,
          message: err?.message || String(err),
          raw: err,
        });
        const code = err?.code ?? err?.data?.code;
        // If Farcaster provider fails internally, try fallback once
        if (providerSource === "farcaster" && code === -32603 && typeof window !== "undefined") {
          try {
            let fallbackProvider: any = undefined;
            const privyProvider = (window as any)?.privy?.getEthereumProvider
              ? await (window as any).privy.getEthereumProvider()
              : undefined;
            if (privyProvider && typeof privyProvider.request === "function") {
              fallbackProvider = privyProvider;
              providerSource = "privy";
            } else if ((window as any).ethereum?.request) {
              fallbackProvider = (window as any).ethereum;
              providerSource = "injected";
            }
            if (fallbackProvider) {
              let accounts = (await fallbackProvider.request({ method: "eth_accounts" })) as
                | string[]
                | undefined;
              if (!accounts || accounts.length === 0) {
                accounts = (await fallbackProvider.request({ method: "eth_requestAccounts" })) as
                  | string[]
                  | undefined;
              }
              address = accounts?.[0];
              if (address) {
                provider = fallbackProvider;
              }
            }
          } catch (fallbackErr) {
            console.error("[useTalentAuthToken] fallback provider failed", fallbackErr);
          }
        }
        if (address) {
          // Proceed with the obtained address after fallback
        } else if (code === -32002) {
          // A wallet request is already pending; ask the user to complete it
          setStage("rejected");
          setError("Wallet request already pending. Please complete it in your wallet.");
          return null;
        } else {
          const deepMsg = err?.data?.originalError?.message || err?.data?.message;
          const msg = String(deepMsg || err?.message || "Failed to request accounts from wallet");
          setStage("rejected");
          setError(code ? `Wallet error (${code}): ${msg}` : msg);
          return null;
        }
      }
      if (!address) {
        // Do not persist a rejection flag; allow user to try again immediately
        setStage("rejected");
        setError("No wallet account found. Please connect an account in your wallet and try again.");
        return null;
      }

      let chainId = 1;
      try {
        const hex = await provider.request({ method: "eth_chainId" });
        if (typeof hex === "string") chainId = parseInt(hex, 16);
      } catch {}

      const nonceResp = await fetch("/api/talent-auth/create-nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chain_id: chainId }),
      });
      if (!nonceResp.ok) throw new Error("Failed to get nonce");
      const nonceData = await nonceResp.json();
      const nonce: string = nonceData?.nonce;
      if (!nonce) throw new Error("Missing nonce from API");

      // 2) Build message
      const message = `Sign in with Talent Protocol\nnonce: ${nonce}`;

      // 4) Sign message
      let signature: string | undefined;
      setStage("sign");
      try {
        signature = await provider.request({
          method: "personal_sign",
          params: [message, address],
        });
      } catch (err: any) {
        // User rejection: set a session flag to prevent auto loops
        const code = err?.code ?? err?.data?.code;
        const msg = String(err?.message || "").toLowerCase();
        const userRejected = code === 4001 || msg.includes("rejected") || msg.includes("denied");
        if (userRejected) {
          try {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("tpAuthRejected", "1");
            }
          } catch {}
          setStage("rejected");
          setError("Signature was cancelled");
          return null;
        }
        console.error("[useTalentAuthToken] personal_sign failed", {
          providerSource,
          code,
          message: err?.message || String(err),
          raw: err,
        });
        throw err;
      }
      if (!signature) {
        // Treat as rejection
        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("tpAuthRejected", "1");
          }
        } catch {}
        setStage("rejected");
        setError("Signature was cancelled");
        return null;
      }

      // 5) Exchange for auth token
      setStage("exchange");
      const tokenResp = await fetch("/api/talent-auth/create-auth-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature, chain_id: chainId }),
      });
      if (!tokenResp.ok) throw new Error("Failed to create auth token");
      const tokenData = await tokenResp.json();
      const newToken: string | undefined = tokenData?.auth?.token;
      const newExp: number | undefined = tokenData?.auth?.expires_at;
      if (!newToken) throw new Error("Missing auth token in response");

      saveToStorage(newToken, newExp);
      setToken(newToken);
      setExpiresAt(newExp ?? null);

      // Mark that auth was just issued so clients bypass local caches once
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("tpAuthJustIssued", "1");
        }
      } catch {}
      return newToken;
      } catch (e) {
      console.error("[useTalentAuthToken] ensureTalentAuthToken failed", e);
      setError(e instanceof Error ? e.message : String(e));
      return null;
      } finally {
      setLoading(false);
      requestingRef.current = false;
      setStage("idle");
      try {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("tpAuthInProgress");
        }
      } catch {}
      }
    })();

    globalEnsurePromise = runner;
    try {
      return await runner;
    } finally {
      globalEnsurePromise = null;
    }
  }, [enabled, isExpiringSoon, readFromStorage, saveToStorage]);

  // Initialize from storage on mount
  useEffect(() => {
    const { token: t, expiresAt: exp } = readFromStorage();
    setToken(t);
    setExpiresAt(exp);

    function handleCustomUpdate(e: Event) {
      const detail = (e as CustomEvent).detail || {};
      setToken(detail.token ?? null);
      setExpiresAt(detail.expiresAt ?? null);
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === "tpAuthToken" || e.key === "tpAuthExpiresAt") {
        const { token: t2, expiresAt: exp2 } = readFromStorage();
        setToken(t2);
        setExpiresAt(exp2);
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("tpAuthTokenUpdated", handleCustomUpdate as EventListener);
      window.addEventListener("storage", handleStorage);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("tpAuthTokenUpdated", handleCustomUpdate as EventListener);
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, [readFromStorage]);

  return {
    token,
    expiresAt,
    loading,
    error,
    stage,
    ensureTalentAuthToken,
    clearToken: () => {
      clearStorage();
      setToken(null);
      setExpiresAt(null);
    },
  } as const;
}



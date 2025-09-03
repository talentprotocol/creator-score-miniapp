"use client";

import { useEffect, useRef, useCallback, useState } from "react";

type EnsureOptions = {
  enabled?: boolean;
};

export function useTalentAuthToken(options: EnsureOptions = {}) {
  const { enabled = true } = options;
  const requestingRef = useRef(false);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // stage: idle | nonce | sign | exchange
  const [stage, setStage] = useState<"idle" | "nonce" | "sign" | "exchange">(
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
  }, []);

  const clearStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("tpAuthToken");
    localStorage.removeItem("tpAuthExpiresAt");
  }, []);

  const isExpiringSoon = useCallback((exp?: number | null) => {
    if (!exp) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    const fiveDays = 5 * 24 * 60 * 60;
    return exp - nowSec < fiveDays;
  }, []);

  // Public method to ensure token exists; prompts signing if missing
  const ensureTalentAuthToken = useCallback(async () => {
    if (!enabled) return null;
    if (requestingRef.current) return token;

    try {
      setLoading(true);
      setError(null);
      setStage("idle");

      const { token: existing, expiresAt: existingExp } = readFromStorage();
      if (existing && !isExpiringSoon(existingExp)) {
        setToken(existing);
        setExpiresAt(existingExp);
        return existing;
      }

      requestingRef.current = true;

      // 1) Get nonce - requires wallet address (and optional chain_id)
      setStage("nonce");
      let address: string | undefined;
      if (typeof window !== "undefined") {
        try {
          const accounts = (await (window as any).ethereum?.request?.({
            method: "eth_requestAccounts",
          })) as string[] | undefined;
          address = accounts?.[0];
        } catch {}
      }
      if (!address) throw new Error("Missing wallet address");

      let chainId = 1;
      if (typeof window !== "undefined") {
        try {
          const hex = await (window as any).ethereum?.request?.({
            method: "eth_chainId",
          });
          if (typeof hex === "string") chainId = parseInt(hex, 16);
        } catch {}
      }

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
      if (typeof window !== "undefined") {
        signature = await (window as any).ethereum?.request?.({
          method: "personal_sign",
          params: [message, address],
        });
      }
      if (!signature) throw new Error("User did not sign message");

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
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setLoading(false);
      requestingRef.current = false;
      setStage("idle");
    }
  }, [enabled, isExpiringSoon, readFromStorage, saveToStorage]);

  // Initialize from storage on mount
  useEffect(() => {
    const { token: t, expiresAt: exp } = readFromStorage();
    setToken(t);
    setExpiresAt(exp);
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



"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { usePrivy, useSignMessage, useWallets } from "@privy-io/react-auth";
import { isFarcasterMiniApp, getFarcasterEthereumProvider, signMessageInMiniApp } from "@/lib/client/miniapp";
import { SiweMessage } from "siwe";
import { getAddress } from "viem";

type EnsureOptions = {
  enabled?: boolean;
};

// Global in-flight promise to dedupe concurrent ensure calls across components
let globalEnsurePromise: Promise<string | null> | null = null;
// Global guard to prevent repeated /me fetches across multiple mounts
let globalMeFetchInFlight = false;

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

  // Helper to encode a UTF-8 string to 0x-prefixed hex for personal_sign
  const convertUtf8ToHex = useCallback((value: string): string => {
    const bytes = new TextEncoder().encode(value);
    let hex = "0x";
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
  }, []);

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

  // Privy context and signer for non-Farcaster environments
  const { user: privyUser, authenticated: privyAuthenticated } = usePrivy();
  const { signMessage } = useSignMessage();
  const { wallets, ready: walletsReady } = useWallets();

  // No embedded wallet usage; only use connected EIP-1193 providers

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
      let inMiniApp = false;
      if (typeof window !== "undefined") {
        const isMiniApp = (await isFarcasterMiniApp(150)) === true;
        inMiniApp = isMiniApp;
        
        try {
          if (isMiniApp) {
            const farcasterProvider = await getFarcasterEthereumProvider();
            if (farcasterProvider && typeof farcasterProvider.request === "function") {
              provider = farcasterProvider;
              providerSource = "farcaster";
            }
          }
        } catch {}
				// Outside Farcaster mini app, we prefer Privy SDK signing; provider is optional.
				if (!provider && !isMiniApp) {
					// If we already have a Privy wallet address, we can proceed without waiting on walletsReady
					const hasPrivyAddress = Boolean((wallets && wallets[0]?.address) || privyUser?.wallet?.address);
					if (!hasPrivyAddress) {
						// Gracefully wait up to 3s for wallets/provider to be ready
						const wait = async (ms: number) => await new Promise((r) => setTimeout(r, ms));
						let readyWaited = 0;
            
						while (!walletsReady && readyWaited < 3000) {
							await wait(150);
							readyWaited += 150;
						}
						if (!walletsReady) {
              
						}
					}
          try {
            const privyProvider = (window as any)?.privy?.getEthereumProvider
              ? await (window as any).privy.getEthereumProvider()
              : undefined;
            if (privyProvider && typeof privyProvider.request === "function") {
              provider = privyProvider;
              providerSource = "privy";
            }
          } catch {}
          if (!provider) {
            const injected = (window as any).ethereum;
            if (injected && typeof injected.request === "function") {
              provider = injected;
              providerSource = "injected";
            }
          }
        }
      }

      // For non-Farcaster flows, provider is optional because we can sign via Privy SDK.
      

      let address: string | undefined;
      if (provider && providerSource === "farcaster") {
        try {
          let accounts = (await provider.request({ method: "eth_accounts" })) as string[] | undefined;
          if (!accounts || accounts.length === 0) {
            accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[] | undefined;
          }
          address = accounts?.[0];
        } catch (err: any) {
          const code = err?.code ?? err?.data?.code;
          if (code === -32002) {
            setStage("rejected");
            setError("Wallet request already pending. Please complete it in your wallet.");
            return null;
          }
          const deepMsg = err?.data?.originalError?.message || err?.data?.message;
          const msg = String(deepMsg || err?.message || "Failed to request accounts from wallet");
          setStage("rejected");
          setError(code ? `Wallet error (${code}): ${msg}` : msg);
          return null;
        }
      } else if (provider && typeof provider.request === "function") {
        // Try to get address from injected/privy provider without prompting
        try {
          const accounts = (await provider.request({ method: "eth_accounts" })) as string[] | undefined;
          address = accounts?.[0] || address;
        } catch {}
        // Fallback to Privy SDK wallet list
        if (!address) {
          address = (wallets && wallets[0]?.address) || privyUser?.wallet?.address || address;
        }
      } else {
        // Outside Farcaster, prefer Privy SDK wallet list
        address = (wallets && wallets[0]?.address) || privyUser?.wallet?.address || address;
      }
      // If no provider was found (due to wallets not being ready), we can still proceed using Privy SDK signing path below
      if (!address) {
        // Wait briefly for wallet address to populate; also poll provider.eth_accounts when available
				const wait = async (ms: number) => await new Promise((r) => setTimeout(r, ms));
				let waited = 0;
        
				while (!address && waited < 2000) {
          let maybe = (wallets && wallets[0]?.address) || privyUser?.wallet?.address;
          if (!maybe && provider && typeof provider.request === "function") {
            try {
              const accs = (await provider.request({ method: "eth_accounts" })) as string[] | undefined;
              maybe = accs?.[0] || maybe;
            } catch {}
          }
					if (maybe) {
						address = maybe;
						break;
					}
					await wait(150);
					waited += 150;
				}
				if (!address) {
					setStage("rejected");
					setError("No wallet account found. Please connect a wallet and try again.");
          
					return null;
				}
			}
      

      let chainId = 1;
      try {
        if (provider && typeof provider.request === "function") {
          const hex = await provider.request({ method: "eth_chainId" });
          if (typeof hex === "string") chainId = parseInt(hex, 16);
        } else if (wallets && wallets.length > 0) {
          // Privy wallet chain ID may be CAIP-2 (e.g., "eip155:1")
          const caip = (wallets[0] as any)?.chainId as string | undefined;
          if (caip && typeof caip === "string") {
            const parts = caip.split(":");
            const parsed = parts.length === 2 ? parseInt(parts[1], 10) : NaN;
            if (!isNaN(parsed)) chainId = parsed;
          }
        }
      } catch {}
      

      
      const nonceResp = await fetch("/api/talent-auth/create-nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chain_id: chainId }),
      });
      if (!nonceResp.ok) {
        throw new Error("Failed to get nonce");
      }
      const nonceData = await nonceResp.json();
      let nonce: string | undefined = nonceData?.nonce;
      
      if (!nonce) {
        // Retry once after a brief delay in case of race conditions
        await new Promise((r) => setTimeout(r, 250));
        
        const retry = await fetch("/api/talent-auth/create-nonce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, chain_id: chainId }),
        });
        if (!retry.ok) {
          throw new Error("Failed to get nonce");
        }
        const retryData = await retry.json();
        const retryNonce: string = retryData?.nonce;
        if (!retryNonce) throw new Error("Missing nonce from API");
        nonce = retryNonce;
      }

      // 2) Build SIWE message
      let message = "";
      try {
        const domain = (typeof window !== "undefined" && window.location.host) || "creator-score.app";
        const uri = (typeof window !== "undefined" && window.location.origin) || "https://creator-score.app";
        // Normalize to checksum address for SIWE
        let checksumAddress = address;
        try {
          if (address && address.startsWith("0x") && address.length === 42) {
            checksumAddress = getAddress(address as `0x${string}`);
          }
        } catch {}
        const siwe = new SiweMessage({
          domain,
          address: checksumAddress,
          statement: "Sign in with Talent Protocol.",
          uri,
          version: "1",
          chainId,
          nonce,
        });
        message = siwe.prepareMessage();
      } catch (e) {
        setStage("rejected");
        setError("Failed to construct SIWE message");
        return null;
      }

      // 4) Sign message
      let signature: string | undefined;
      setStage("sign");
      
      try {
        // In Farcaster Mini App, always attempt SDK signing first even if provider isn't detected
        if (inMiniApp && !signature && providerSource !== "farcaster") {
          const miniSigPre = await signMessageInMiniApp(message);
          if (miniSigPre) {
            signature = miniSigPre;
          }
        }
        // Prefer Mini App SDK wallet signing when present to avoid CORS
        if (providerSource === "farcaster") {
          const miniSig = await signMessageInMiniApp(message);
          if (miniSig) {
            signature = miniSig;
          } else if (provider && typeof provider.request === "function") {
            // Fallback: use Farcaster EIP-1193 provider to request signature
            const hexMessage = convertUtf8ToHex(message);
            try {
              signature = await provider.request({ method: "personal_sign", params: [hexMessage, address] });
            } catch (innerErr: any) {
              try {
                signature = await provider.request({ method: "personal_sign", params: [address, hexMessage] });
              } catch {
                signature = await provider.request({ method: "personal_sign", params: [message, address] });
              }
            }
          }
        }
        if (!signature && providerSource !== "farcaster" && !inMiniApp) {
          const hasPrivyWallet = Boolean(
            (wallets && wallets.find((w) => (w.address || "").toLowerCase() === (address || "").toLowerCase())) ||
              (privyUser?.wallet?.address || "").toLowerCase() === (address || "").toLowerCase(),
          );
          // Strategy: If the signing address belongs to a Privy wallet, use Privy SDK; otherwise use injected provider
          if (hasPrivyWallet) {
            try {
              
              const res = await signMessage({ message }, { address });
              signature = res?.signature;
            } catch (sdkErr) {
              
              if (provider && typeof provider.request === "function") {
                const hexMessage = convertUtf8ToHex(message);
                try {
                  signature = await provider.request({ method: "personal_sign", params: [hexMessage, address] });
                } catch (innerErr: any) {
                  try {
                    signature = await provider.request({ method: "personal_sign", params: [address, hexMessage] });
                  } catch {
                    signature = await provider.request({ method: "personal_sign", params: [message, address] });
                  }
                }
              } else {
                throw sdkErr;
              }
            }
          } else if (provider && typeof provider.request === "function") {
            
            const hexMessage = convertUtf8ToHex(message);
            try {
              signature = await provider.request({ method: "personal_sign", params: [hexMessage, address] });
            } catch (innerErr: any) {
              try {
                signature = await provider.request({ method: "personal_sign", params: [address, hexMessage] });
              } catch {
                signature = await provider.request({ method: "personal_sign", params: [message, address] });
              }
            }
          } else {
            
          }
        }
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
          console.error("Signature was cancelled", err);
          return null;
        }
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
        body: JSON.stringify({ address, chain_id: chainId, signature, siwe_message: message }),
      });
      if (!tokenResp.ok) {
        try {
          const txt = await tokenResp.text();
          throw new Error(`Failed to create auth token: ${tokenResp.status} ${tokenResp.statusText} ${txt || ""}`.trim());
        } catch {
          throw new Error("Failed to create auth token");
        }
      }
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

    // If we have a token but no stored talentUserId, attempt to derive it
    try {
      if (typeof window !== "undefined" && t) {
        const hasTalentId = !!localStorage.getItem("talentUserId");
        const meFetched = sessionStorage.getItem("tpMeFetched") === "1";
        const meInProgress = sessionStorage.getItem("tpMeInProgress") === "1";
        if (!hasTalentId && !meFetched && !meInProgress && !globalMeFetchInFlight) {
          sessionStorage.setItem("tpMeInProgress", "1");
          globalMeFetchInFlight = true;
          // Preferred: fetch current user via Talent API using our server route, then store id
          (async () => {
            let stored = false;
            try {
              const resp = await fetch("/api/talent-auth/me", {
                method: "GET",
                headers: { "x-talent-auth-token": t },
              });
              if (resp.ok) {
                const data = await resp.json();
                const uuid = data?.id as string | undefined;
                if (uuid && typeof uuid === "string") {
                  localStorage.setItem("talentUserId", uuid);
                  stored = true;
                  try {
                    window.dispatchEvent(
                      new CustomEvent("talentUserIdUpdated", { detail: { talentUserId: uuid } }),
                    );
                  } catch {}
                }
              }
            } catch {}
            finally {
              // Only mark fetched when we successfully stored a UUID, so retries remain possible otherwise
              try { if (stored) sessionStorage.setItem("tpMeFetched", "1"); } catch {}
              try { sessionStorage.removeItem("tpMeInProgress"); } catch {}
              globalMeFetchInFlight = false;
            }
          })();
        }
      }
    } catch {}

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
      // Also listen for cross-hook talent id updates
      window.addEventListener("talentUserIdUpdated", () => {
        // No state to set here; just ensures listeners exist if needed later
      });
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("tpAuthTokenUpdated", handleCustomUpdate as EventListener);
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("talentUserIdUpdated", () => {});
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



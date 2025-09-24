"use client";

import { useEffect, useState } from "react";

/**
 * Returns whether a Talent Protocol auth token exists in localStorage.
 * Subscribes to both the custom "tpAuthTokenUpdated" event and storage events
 * so state stays in sync across tabs and components.
 */
export function useTalentAuthPresence(): { hasToken: boolean } {
  const [hasToken, setHasToken] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        setHasToken(!!localStorage.getItem("tpAuthToken"));

        const handleUpdate = (e: Event) => {
          const detail = (e as CustomEvent).detail || {};
          setHasToken(!!detail.token);
        };

        const handleStorage = (e: StorageEvent) => {
          if (e.key === "tpAuthToken" || e.key === "tpAuthExpiresAt") {
            setHasToken(!!localStorage.getItem("tpAuthToken"));
          }
        };

        window.addEventListener("tpAuthTokenUpdated", handleUpdate as EventListener);
        window.addEventListener("storage", handleStorage);

        return () => {
          window.removeEventListener("tpAuthTokenUpdated", handleUpdate as EventListener);
          window.removeEventListener("storage", handleStorage);
        };
      }
    } catch {}
  }, []);

  return { hasToken };
}



"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Captures auth_token passed via querystring on any page, verifies it,
 * stores it in localStorage, emits update event, and then removes it from the URL.
 *
 * This runs globally (included in app/providers.tsx) so all protected routes benefit.
 */
export function AuthTokenUrlHandler() {
  const router = useRouter();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get("auth_token");
      const expStr = url.searchParams.get("auth_token_expires_at") || url.searchParams.get("expires_at");
      if (!token) return;
      handledRef.current = true;

      (async () => {
        try {
          const resp = await fetch("/api/talent-auth/me", {
            method: "GET",
            headers: { "x-talent-auth-token": token },
          });
          if (resp.ok) {
            try {
              localStorage.setItem("tpAuthToken", token);
              if (expStr) localStorage.setItem("tpAuthExpiresAt", String(Number(expStr)));
              try {
                window.dispatchEvent(
                  new CustomEvent("tpAuthTokenUpdated", {
                    detail: { token, expiresAt: expStr ? Number(expStr) : null },
                  }),
                );
              } catch {}
            } catch {}
          }
        } catch {}

        // Clean sensitive params from URL regardless of verification result
        try {
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("auth_token");
          cleanUrl.searchParams.delete("auth_token_expires_at");
          cleanUrl.searchParams.delete("expires_at");
          const newSearch = cleanUrl.searchParams.toString();
          const newHref = cleanUrl.pathname + (newSearch ? `?${newSearch}` : "") + cleanUrl.hash;
          router.replace(newHref, { scroll: false });
        } catch {}
      })();
    } catch {}
  }, [router]);

  return null;
}



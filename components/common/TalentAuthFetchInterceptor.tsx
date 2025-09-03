"use client";

import { useEffect } from "react";

export function TalentAuthFetchInterceptor() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalFetch = window.fetch;

    function getRequestUrl(input: RequestInfo | URL): string {
      if (typeof input === "string") return input;
      if (input instanceof URL) return input.toString();
      try {
        // Narrow to Request when possible
        if (typeof Request !== "undefined" && input instanceof Request) {
          return input.url;
        }
      } catch {
        // fallthrough to fallback below
      }
      return String(input);
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = getRequestUrl(input);
        if (url.startsWith("/api/")) {
          const token = localStorage.getItem("tpAuthToken");
          if (token) {
            const headers = new Headers(init?.headers || {});
            // Do not override if explicitly set
            if (!headers.has("X-Talent-Auth-Token")) {
              headers.set("X-Talent-Auth-Token", token);
            }

            return originalFetch(input, {
              ...init,
              headers,
            });
          }
        }
      } catch {
        // fall through to original fetch
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}



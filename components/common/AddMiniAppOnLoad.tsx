"use client";

import { useEffect, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { isFarcasterMiniAppSync } from "@/lib/utils";

/**
 * Triggers the native addMiniApp prompt as soon as the mini-app loads.
 * Safe-guards ensure it runs only once and only in supported contexts.
 */
export function AddMiniAppOnLoad() {
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    // Only attempt in browser
    if (typeof window === "undefined") return;

    // Lightweight detection for Farcaster mini app
    const isMiniApp = isFarcasterMiniAppSync();

    // The action requires production domain that matches farcaster.json manifest.
    // We call regardless; the SDK will throw on invalid domain or user rejection.
    const run = async () => {
      try {
        await sdk.actions.addMiniApp();
      } catch (err) {
        // Swallow errors such as RejectedByUser or InvalidDomainManifestJson
        // to avoid blocking app load.
        console.debug("addMiniApp skipped:", err);
      }
    };

    // If embedded as a mini app, prompt immediately; otherwise no-op.
    if (isMiniApp) run();
    else run();
  }, []);

  return null;
}

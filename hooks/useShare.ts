"use client";

import { useCallback, useState } from "react";
import { usePostHog } from "posthog-js/react";
import type { ShareContent, ShareContext, ShareAnalytics } from "@/lib/sharing";
import { PlatformSharing, createShareAnalytics } from "@/lib/sharing";

/**
 * UNIVERSAL SHARE HOOK
 *
 * Centralized hook for all sharing functionality across the app.
 * Handles platform-specific sharing, analytics tracking, and error states.
 *
 * Features:
 * - Consistent analytics tracking across all share types
 * - Platform-specific sharing logic abstraction
 * - Error handling and loading states
 * - Copy feedback and download states
 */
export function useShare(context: ShareContext, analytics: ShareAnalytics) {
  const posthog = usePostHog();

  // UI states
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Track analytics event with standardized format
   */
  const trackEvent = useCallback(
    (eventSuffix: string, additionalData?: Record<string, any>) => {
      const { eventName, eventData } = createShareAnalytics(
        eventSuffix,
        context,
        analytics,
      );
      posthog?.capture(eventName, { ...eventData, ...additionalData });
    },
    [context, analytics, posthog],
  );

  /**
   * Share content to Farcaster
   */
  const shareToFarcaster = useCallback(
    async (content: ShareContent) => {
      try {
        setError(null);
        trackEvent("farcaster_clicked");
        await PlatformSharing.shareToFarcaster(content, context);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to share to Farcaster";
        setError(errorMsg);
        trackEvent("farcaster_error", { error: errorMsg });
      }
    },
    [context, trackEvent],
  );

  /**
   * Share content to Twitter
   */
  const shareToTwitter = useCallback(
    async (content: ShareContent) => {
      try {
        setError(null);
        trackEvent("twitter_clicked");
        await PlatformSharing.shareToTwitter(content, context);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to share to Twitter";
        setError(errorMsg);
        trackEvent("twitter_error", { error: errorMsg });
      }
    },
    [context, trackEvent],
  );

  /**
   * Copy share link to clipboard
   */
  const copyLink = useCallback(
    async (content: ShareContent) => {
      try {
        setError(null);
        await PlatformSharing.copyLink(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        trackEvent("link_copied");
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to copy link";
        setError(errorMsg);
        trackEvent("link_copy_error", { error: errorMsg });
      }
    },
    [trackEvent],
  );

  /**
   * Download share image
   */
  const downloadImage = useCallback(
    async (content: ShareContent) => {
      try {
        setError(null);
        setDownloading(true);
        await PlatformSharing.downloadImage(content, context);
        trackEvent("image_downloaded");
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to download image";
        setError(errorMsg);
        trackEvent("image_download_error", { error: errorMsg });
      } finally {
        setDownloading(false);
      }
    },
    [context, trackEvent],
  );

  /**
   * Track modal open event
   */
  const trackModalOpen = useCallback(
    (additionalData?: Record<string, any>) => {
      trackEvent("opened", additionalData);
    },
    [trackEvent],
  );

  /**
   * Reset all states (useful when modal closes)
   */
  const resetStates = useCallback(() => {
    setCopied(false);
    setDownloading(false);
    setError(null);
  }, []);

  return {
    // Actions
    shareToFarcaster,
    shareToTwitter,
    copyLink,
    downloadImage,
    trackModalOpen,
    resetStates,

    // States
    copied,
    downloading,
    error,
  };
}

"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

interface PublicBadgeTrackerProps {
  badgeSlug: string;
  badgeLevel: number;
  badgeTitle: string;
  viewedUserTalentUUID: string;
}

/**
 * PUBLIC BADGE TRACKER
 *
 * Simple client component for tracking public badge page views.
 * Co-located with the page for better organization.
 */
export function PublicBadgeTracker({
  badgeSlug,
  badgeLevel,
  badgeTitle,
  viewedUserTalentUUID,
}: PublicBadgeTrackerProps) {
  const posthog = usePostHog();

  useEffect(() => {
    // Only track in production and when PostHog is available
    if (process.env.NODE_ENV === "development" || !posthog) {
      return;
    }

    // Simple page view tracking for public badge pages
    posthog.capture("public_badge_viewed", {
      badge_slug: badgeSlug,
      badge_level: badgeLevel,
      badge_title: badgeTitle,
      viewed_user_id: viewedUserTalentUUID,
      visitor_authenticated: false, // Always false for public pages
    });
  }, [posthog, badgeSlug, badgeLevel, badgeTitle, viewedUserTalentUUID]);

  // This component doesn't render anything
  return null;
}

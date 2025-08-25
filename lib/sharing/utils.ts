/**
 * SHARING SYSTEM TYPES & UTILITIES
 *
 * Consolidated types and utility functions for the universal sharing system.
 * Includes type definitions, URL resolution, filename sanitization, and analytics helpers.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ShareType =
  | "profile"
  | "badge"
  | "optout"
  | "achievement"
  | "unknown";

export interface ShareContent {
  /** The type of content being shared */
  type: ShareType;
  /** Modal title */
  title: string;
  /** Modal description */
  description: string;
  /** Image URL for preview (can be absolute or relative) */
  imageUrl: string;
  /** Filename for downloads (sanitized) */
  filename: string;
  /** Canonical URL for the shared content */
  url: string;
  /** Platform-specific share text for Farcaster */
  farcasterText: string;
  /** Platform-specific share text for Twitter */
  twitterText: string;
}

export interface ShareContext {
  /** User's Talent Protocol UUID */
  talentUUID: string;
  /** Public handle/identifier for URLs */
  handle: string;
  /** Current app client type for platform detection */
  appClient: string | null;
}

export interface ShareAnalytics {
  /** Event prefix for analytics (e.g., 'badge_share', 'profile_share') */
  eventPrefix: string;
  /** Additional metadata to include with all events */
  metadata: Record<string, unknown>;
}

export interface ShareModalOptions {
  /** Disable Twitter sharing button */
  disableTwitter?: boolean;
  /** Disable image download button */
  disableDownload?: boolean;
  /** Custom action buttons to add */
  customActions?: React.ReactNode;
}

/**
 * Standard analytics event schema for all sharing events
 * Base events: ${eventPrefix}_opened, ${eventPrefix}_farcaster_clicked, etc.
 */
export interface BaseShareAnalytics {
  talent_uuid: string;
  handle: string;
  share_type: ShareType;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the canonical public profile identifier for share URLs
 * Prefers Farcaster handle (fname) when available, falls back to talentUUID
 *
 * @param options - Object containing fname and talentUUID
 * @returns Public identifier for profile URLs
 */
export function getPublicProfileIdentifier({
  fname,
  talentUUID,
}: {
  fname?: string | null;
  talentUUID: string;
}): string {
  // Prefer fname for better UX, fallback to talentUUID
  return fname && fname.trim() ? fname.trim() : talentUUID;
}

/**
 * Sanitize filename for safe downloads
 * Removes/replaces unsafe characters and limits length
 *
 * @param filename - Original filename
 * @returns Sanitized filename safe for downloads
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "-") // Replace unsafe chars with dash
    .replace(/-+/g, "-") // Collapse multiple dashes
    .replace(/^-|-$/g, "") // Remove leading/trailing dashes
    .toLowerCase()
    .substring(0, 100); // Limit length
}

/**
 * Resolve image URL - handle both absolute and relative URLs
 *
 * @param imageUrl - Image URL (absolute or relative)
 * @param baseUrl - Base URL for relative paths
 * @returns Full image URL
 */
export function resolveImageUrl(imageUrl: string, baseUrl?: string): string {
  // If already absolute, return as-is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // For relative URLs, prepend base URL
  const base =
    baseUrl || process.env.NEXT_PUBLIC_URL || "https://creatorscore.app";
  return `${base}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

/**
 * Generate canonical share URL for content
 *
 * @param handle - Public identifier
 * @param fragment - Optional fragment for specific content (e.g., badges)
 * @returns Canonical share URL
 */
export function generateShareUrl(handle: string, fragment?: string): string {
  const baseUrl = "https://creatorscore.app";
  const url = `${baseUrl}/${encodeURIComponent(handle)}`;
  return fragment ? `${url}#${fragment}` : url;
}

/**
 * Create standardized analytics helper
 *
 * @param eventSuffix - Event suffix (e.g., 'opened', 'farcaster_clicked')
 * @param context - Share context
 * @param analytics - Analytics configuration
 * @returns Complete analytics event data
 */
export function createShareAnalytics(
  eventSuffix: string,
  context: ShareContext,
  analytics: ShareAnalytics,
): {
  eventName: string;
  eventData: BaseShareAnalytics & Record<string, unknown>;
} {
  const eventName = `${analytics.eventPrefix}_${eventSuffix}`;
  const eventData = {
    talent_uuid: context.talentUUID,
    handle: context.handle,
    share_type: (analytics.metadata.share_type as ShareType) || "unknown",
    ...analytics.metadata,
  };

  return { eventName, eventData };
}

/**
 * Generate dynamic alt text for share previews
 *
 * @param shareType - Type of content being shared
 * @param metadata - Additional context for alt text
 * @returns Descriptive alt text
 */
export function generateAltText(
  shareType: string,
  metadata?: Record<string, unknown>,
): string {
  switch (shareType) {
    case "badge":
      const badgeLevel = metadata?.badge_level;
      const badgeTitle = metadata?.badge_title;
      return `Creator Badge: ${badgeTitle}${badgeLevel ? ` Level ${badgeLevel}` : ""}`;
    case "profile":
      return "Creator Score Profile Share Preview";
    case "optout":
      return "Pay It Forward Share Preview";
    case "unknown":
      return "Share Preview";
    default:
      return "Share Preview";
  }
}

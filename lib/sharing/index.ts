/**
 * SHARING SYSTEM PUBLIC API
 *
 * Clean, consolidated exports for the universal sharing system.
 * Import everything you need from a single location.
 */

// Re-export all types and utilities
export type {
  ShareType,
  ShareContent,
  ShareContext,
  ShareAnalytics,
  ShareModalOptions,
  BaseShareAnalytics,
} from "./utils";

export {
  getPublicProfileIdentifier,
  sanitizeFilename,
  resolveImageUrl,
  generateShareUrl,
  createShareAnalytics,
  generateAltText,
} from "./utils";

// Re-export all sharing core functionality
export type { ProfileData } from "./sharing";

export { PlatformSharing, ShareContentGenerators } from "./sharing";

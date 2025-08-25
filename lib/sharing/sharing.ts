/**
 * SHARING SYSTEM CORE
 *
 * Consolidated platform sharing logic and content generators.
 * Handles all platform-specific sharing implementations and content generation
 * for different share types (badges, profiles, optout).
 */

import { openExternalUrl } from "@/lib/utils";
import type { BadgeState } from "@/app/services/badgesService";
import type { ShareContent, ShareContext } from "./utils";
import { sanitizeFilename, generateShareUrl, resolveImageUrl } from "./utils";

// ============================================================================
// PLATFORM SHARING LOGIC
// ============================================================================

/**
 * Centralized platform-specific sharing implementations.
 * Handles Farcaster, Twitter, link copying, and image downloads
 * with consistent error handling and client detection.
 */
export class PlatformSharing {
  /**
   * Share content to Farcaster
   * Uses native SDK in Farcaster/Base clients, web intent for others
   */
  static async shareToFarcaster(
    content: ShareContent,
    context: ShareContext,
  ): Promise<void> {
    const { farcasterText, url } = content;
    const { appClient } = context;

    if (appClient === "farcaster" || appClient === "base") {
      try {
        const { sdk } = await import("@farcaster/frame-sdk");
        await sdk.actions.composeCast({
          text: farcasterText,
          embeds: [url],
        });
      } catch (error) {
        console.error("Failed to compose cast:", error);
        throw new Error("Failed to share to Farcaster");
      }
    } else {
      // Open Farcaster web app with pre-filled cast
      const farcasterUrl = `https://farcaster.xyz/~/compose?text=${encodeURIComponent(farcasterText)}&embeds[]=${encodeURIComponent(url)}`;

      if (appClient === "browser") {
        window.open(farcasterUrl, "_blank");
      } else {
        openExternalUrl(farcasterUrl, null, appClient);
      }
    }
  }

  /**
   * Share content to Twitter/X
   * Always uses web intent URLs for consistency
   */
  static async shareToTwitter(
    content: ShareContent,
    context: ShareContext,
  ): Promise<void> {
    const { twitterText, url } = content;
    const { appClient } = context;

    // Always use web URL for Twitter sharing
    const twitterUrl = `https://x.com/intent/post?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(url)}`;

    if (appClient === "browser") {
      window.open(twitterUrl, "_blank");
    } else {
      openExternalUrl(twitterUrl, null, appClient);
    }
  }

  /**
   * Copy share URL to clipboard
   */
  static async copyLink(content: ShareContent): Promise<void> {
    try {
      await navigator.clipboard.writeText(content.url);
    } catch (error) {
      console.error("Failed to copy link:", error);
      throw new Error("Failed to copy link to clipboard");
    }
  }

  /**
   * Download share image
   * Handles both browser and external app scenarios
   */
  static async downloadImage(
    content: ShareContent,
    context: ShareContext,
  ): Promise<void> {
    try {
      const { imageUrl, filename } = content;
      const { appClient } = context;

      const fullImageUrl = resolveImageUrl(imageUrl);

      if (appClient === "browser") {
        const response = await fetch(fullImageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        openExternalUrl(fullImageUrl, null, appClient);
      }
    } catch (error) {
      console.error("Failed to download image:", error);
      throw new Error("Failed to download image");
    }
  }
}

// ============================================================================
// CONTENT GENERATORS
// ============================================================================

/**
 * Profile data interface for share content generation
 */
export interface ProfileData {
  creatorScore?: number;
  totalFollowers?: number;
  totalEarnings?: number;
  rank?: number;
  displayName?: string;
  fname?: string;
  creatorType?: string;
  creatorEmoji?: string;
}

/**
 * Content generators for different share types
 * Centralizes all user-facing text for easy maintenance and localization
 */
export class ShareContentGenerators {
  /**
   * Generate share content for user profiles
   */
  static profile(
    context: ShareContext,
    profileData: ProfileData,
  ): ShareContent {
    const { handle, talentUUID } = context;

    // Format display values
    const scoreText = profileData.creatorScore
      ? profileData.creatorScore.toLocaleString()
      : "—";
    const followersText = profileData.totalFollowers
      ? formatCompactNumber(profileData.totalFollowers)
      : "—";
    const earningsText = profileData.totalEarnings
      ? formatNumberWithSuffix(profileData.totalEarnings)
      : "—";
    const rankText = profileData.rank
      ? `#${profileData.rank.toLocaleString()}`
      : "—";

    // Creator type and emoji
    const creatorType = profileData.creatorType || "Creator";
    const creatorEmoji = profileData.creatorEmoji || "👤";

    // Handle for mentions
    const farcasterHandle = profileData.fname || handle;
    const displayName = profileData.displayName || handle;

    // Generate URLs and content
    const url = generateShareUrl(handle);
    const filename = sanitizeFilename(`${handle}-creator-score.png`);

    const farcasterText = `Check @${farcasterHandle}'s creator stats:\n\n${creatorEmoji} ${creatorType} • 👥 ${followersText} followers\n📊 Score: ${scoreText} • Rank: ${rankText}\n💰 Earnings: ${earningsText}\n\nCheck your Creator Score by @Talent 👇`;

    const twitterText = `Check ${displayName}'s onchain creator stats:\n\n📊 Creator Score: ${scoreText}\n🫂 Total Followers: ${followersText}\n💰 Total Earnings: ${earningsText}\n🏆 Rank: ${rankText}\n\nTrack your reputation in the Creator Score App, built by @TalentProtocol 👇`;

    return {
      type: "profile",
      title: "Share Your Creator Score",
      description: "Share your creator stats with your audience.",
      imageUrl: `/api/share-image/${talentUUID}`,
      filename,
      url,
      farcasterText,
      twitterText,
    };
  }

  /**
   * Generate share content for badges
   */
  static badge(context: ShareContext, badge: BadgeState): ShareContent {
    const { handle, talentUUID } = context;

    // Badge-specific content
    const badgeTitle = badge.title;
    const levelLabel = badge.levelLabel;
    const isEarned = badge.currentLevel > 0;

    // Generate URLs and content (link to main profile, badges will be added later)
    const url = generateShareUrl(handle);
    const filename = sanitizeFilename(`${handle}-${badge.badgeSlug}-badge.png`);

    // Generate dynamic badge share image URL
    const badgeImageParams = new URLSearchParams({
      talentUUID,
      level: badge.currentLevel.toString(),
      title: badgeTitle,
    });
    const imageUrl = `/api/share-image-badge/${badge.badgeSlug}?${badgeImageParams}`;

    // Different messaging for earned vs locked badges
    let farcasterText: string;
    let twitterText: string;

    if (isEarned) {
      farcasterText = `Just earned ${levelLabel} in ${badgeTitle}! 🏆\n\nCheck out my Creator Score profile and see what badges you can unlock 👇`;
      twitterText = `Just earned ${levelLabel} in ${badgeTitle}! 🏆\n\nCheck out my Creator Score profile and see what badges you can unlock in the Creator Score App, built by @TalentProtocol 👇`;
    } else {
      farcasterText = `Working towards my ${badgeTitle} badge on Creator Score! 💪\n\nCheck out my profile and see what badges you can unlock 👇`;
      twitterText = `Working towards my ${badgeTitle} badge on Creator Score! 💪\n\nCheck out my profile and see what badges you can unlock in the Creator Score App, built by @TalentProtocol 👇`;
    }

    return {
      type: "badge",
      title: isEarned ? "Share Your Badge" : "Share Your Progress",
      description: isEarned
        ? `Share your ${badgeTitle} achievement.`
        : `Share your progress towards ${badgeTitle}.`,
      imageUrl, // Dynamic badge share image
      filename,
      url,
      farcasterText,
      twitterText,
    };
  }

  /**
   * Generate share content for pay-it-forward/opt-out
   */
  static optout(context: ShareContext): ShareContent {
    const { handle, talentUUID } = context;

    // Generate URLs and content
    const url = generateShareUrl(handle);
    const filename = sanitizeFilename(`${handle}-paid-forward.png`);

    const farcasterText = `I paid forward 100 percent of my Creator Score rewards to support onchain creators.\n\nCheck out my profile in the Creator Score app, built by @talent 👇`;

    const twitterText = `I paid forward 100 percent of my Creator Score rewards to support onchain creators.\n\nCheck out my profile in the Creator Score App, built by @TalentProtocol 👇`;

    return {
      type: "optout",
      title: "Share Your Good Deed",
      description: "Let the world know you support creators",
      imageUrl: `/api/share-image-optout/${talentUUID}`,
      filename,
      url,
      farcasterText,
      twitterText,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper functions for formatting (imported from utils if available)
 * These should eventually be moved to a central utils file
 */
function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function formatNumberWithSuffix(num: number): string {
  // This should match the existing formatNumberWithSuffix from utils
  return `$${formatCompactNumber(num)}`;
}

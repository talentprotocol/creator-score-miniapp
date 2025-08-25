/**
 * Integration tests for the sharing system foundation
 * Tests the complete flow from content generation to sharing preparation
 */

import { ShareContentGenerators } from "../sharing";
import { createShareAnalytics, generateAltText } from "../utils";
import type { ShareContext, ShareAnalytics } from "../utils";
import type { BadgeState } from "@/app/services/badgesService";

const mockContext: ShareContext = {
  talentUUID: "test-uuid-123",
  handle: "testuser",
  appClient: "browser",
};

const mockBadge: BadgeState = {
  badgeSlug: "creator-score",
  title: "Creator Score",
  currentLevel: 3,
  maxLevel: 6,
  isMaxLevel: false,
  levelLabel: "Level 3 - Rising Star",
  progressLabel: "500 points left",
  progressPct: 75,
  artworkUrl: "/images/badges/creator-score-3.webp",
  description: "Earned for reaching Creator Score milestones",
  categoryName: "Trophies",
};

describe("Sharing System Integration", () => {
  describe("Badge sharing flow", () => {
    it("should generate complete badge share content with analytics", () => {
      // Generate share content
      const shareContent = ShareContentGenerators.badge(mockContext, mockBadge);

      // Create analytics configuration
      const analytics: ShareAnalytics = {
        eventPrefix: "badge_share",
        metadata: {
          share_type: "badge",
          badge_slug: mockBadge.badgeSlug,
          badge_level: mockBadge.currentLevel,
          badge_category: mockBadge.categoryName,
          is_earned: mockBadge.currentLevel > 0,
        },
      };

      // Test analytics event creation
      const { eventName, eventData } = createShareAnalytics(
        "opened",
        mockContext,
        analytics,
      );

      // Verify complete integration
      expect(shareContent).toMatchObject({
        type: "badge",
        title: "Share Your Badge",
        url: "https://creatorscore.app/testuser#badges",
        filename: "testuser-creator-score-badge.png",
        imageUrl: "/images/badges/creator-score-3.webp",
      });

      expect(shareContent.farcasterText).toContain("Level 3 - Rising Star");
      expect(shareContent.farcasterText).toContain("Creator Score");
      expect(shareContent.farcasterText).toContain("🏆");

      expect(eventName).toBe("badge_share_opened");
      expect(eventData).toMatchObject({
        talent_uuid: "test-uuid-123",
        handle: "testuser",
        share_type: "badge",
        badge_slug: "creator-score",
        badge_level: 3,
        is_earned: true,
      });

      // Test alt text generation
      const altText = generateAltText("badge", {
        badge_title: mockBadge.title,
        badge_level: mockBadge.currentLevel,
      });
      expect(altText).toBe("Creator Badge: Creator Score Level 3");
    });

    it("should handle locked badge sharing", () => {
      const lockedBadge = {
        ...mockBadge,
        currentLevel: 0,
        levelLabel: "Locked",
      };

      const shareContent = ShareContentGenerators.badge(
        mockContext,
        lockedBadge,
      );

      expect(shareContent.title).toBe("Share Your Progress");
      expect(shareContent.farcasterText).toContain("Working towards");
      expect(shareContent.farcasterText).toContain("💪");
    });
  });

  describe("Profile sharing flow", () => {
    it("should generate complete profile share content", () => {
      const profileData = {
        creatorScore: 1500,
        totalFollowers: 2500,
        totalEarnings: 1200,
        rank: 50,
        displayName: "Test User",
        fname: "testuser",
        creatorType: "Builder",
        creatorEmoji: "🛠️",
      };

      const shareContent = ShareContentGenerators.profile(
        mockContext,
        profileData,
      );

      expect(shareContent).toMatchObject({
        type: "profile",
        title: "Share Your Creator Score",
        url: "https://creatorscore.app/testuser",
        filename: "testuser-creator-score.png",
        imageUrl: "/api/share-image/test-uuid-123",
      });

      expect(shareContent.farcasterText).toContain("@testuser");
      expect(shareContent.farcasterText).toContain("🛠️ Builder");
      expect(shareContent.farcasterText).toContain("1,500");
      expect(shareContent.farcasterText).toContain("#50");
    });
  });

  describe("Optout sharing flow", () => {
    it("should generate complete optout share content", () => {
      const shareContent = ShareContentGenerators.optout(mockContext);

      expect(shareContent).toMatchObject({
        type: "optout",
        title: "Share Your Good Deed",
        url: "https://creatorscore.app/testuser",
        filename: "testuser-paid-forward.png",
        imageUrl: "/api/share-image-optout/test-uuid-123",
      });

      expect(shareContent.farcasterText).toContain("paid forward 100 percent");
      expect(shareContent.twitterText).toContain("@TalentProtocol");
    });
  });
});

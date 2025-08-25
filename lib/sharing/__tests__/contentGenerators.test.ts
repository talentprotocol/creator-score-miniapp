/**
 * Tests for share content generators
 */

import { ShareContentGenerators } from "../sharing";
import type { ShareContext } from "../utils";
import type { BadgeState } from "@/app/services/badgesService";

const mockContext: ShareContext = {
  talentUUID: "uuid-123",
  handle: "testuser",
  appClient: "browser",
};

describe("ShareContentGenerators.profile", () => {
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

  it("should generate complete profile share content", () => {
    const result = ShareContentGenerators.profile(mockContext, profileData);

    expect(result.type).toBe("profile");
    expect(result.title).toBe("Share Your Creator Score");
    expect(result.url).toBe("https://creatorscore.app/testuser");
    expect(result.filename).toBe("testuser-creator-score.png");
    expect(result.imageUrl).toBe("/api/share-image/uuid-123");

    // Check Farcaster text contains expected elements
    expect(result.farcasterText).toContain("@testuser");
    expect(result.farcasterText).toContain("🛠️ Builder");
    expect(result.farcasterText).toContain("1,500");
    expect(result.farcasterText).toContain("#50");

    // Check Twitter text contains expected elements
    expect(result.twitterText).toContain("Test User");
    expect(result.twitterText).toContain("1,500");
    expect(result.twitterText).toContain("@TalentProtocol");
  });

  it("should handle missing profile data gracefully", () => {
    const result = ShareContentGenerators.profile(mockContext, {});

    expect(result.farcasterText).toContain("—"); // Missing values show as em dash
    expect(result.twitterText).toContain("—");
    expect(result.farcasterText).toContain("👤 Creator"); // Default values
  });
});

describe("ShareContentGenerators.badge", () => {
  const earnedBadge: BadgeState = {
    badgeSlug: "creator-score",
    title: "Creator Score",
    currentLevel: 3,
    maxLevel: 6,
    isMaxLevel: false,
    levelLabel: "Level 3",
    progressLabel: "500 left",
    progressPct: 75,
    artworkUrl: "/badge-artwork.png",
    description: "Badge description",
    categoryName: "Trophies",
  };

  const lockedBadge: BadgeState = {
    ...earnedBadge,
    currentLevel: 0,
    levelLabel: "Locked",
    progressLabel: "1000 left",
    progressPct: 0,
  };

  it("should generate earned badge share content", () => {
    const result = ShareContentGenerators.badge(mockContext, earnedBadge);

    expect(result.type).toBe("badge");
    expect(result.title).toBe("Share Your Badge");
    expect(result.description).toBe("Share your Creator Score achievement.");
    expect(result.url).toBe("https://creatorscore.app/testuser#badges");
    expect(result.filename).toBe("testuser-creator-score-badge.png");
    expect(result.imageUrl).toBe("/badge-artwork.png");

    // Check earned badge messaging
    expect(result.farcasterText).toContain("Just earned Level 3");
    expect(result.farcasterText).toContain("🏆");
    expect(result.twitterText).toContain("Just earned Level 3");
  });

  it("should generate locked badge share content", () => {
    const result = ShareContentGenerators.badge(mockContext, lockedBadge);

    expect(result.title).toBe("Share Your Progress");
    expect(result.description).toBe(
      "Share your progress towards Creator Score.",
    );

    // Check locked badge messaging
    expect(result.farcasterText).toContain(
      "Working towards my Creator Score badge",
    );
    expect(result.farcasterText).toContain("💪");
    expect(result.twitterText).toContain(
      "Working towards my Creator Score badge",
    );
  });
});

describe("ShareContentGenerators.optout", () => {
  it("should generate optout share content", () => {
    const result = ShareContentGenerators.optout(mockContext);

    expect(result.type).toBe("optout");
    expect(result.title).toBe("Share Your Good Deed");
    expect(result.description).toBe("Let the world know you support creators");
    expect(result.url).toBe("https://creatorscore.app/testuser");
    expect(result.filename).toBe("testuser-paid-forward.png");
    expect(result.imageUrl).toBe("/api/share-image-optout/uuid-123");

    // Check optout messaging
    expect(result.farcasterText).toContain("paid forward 100 percent");
    expect(result.farcasterText).toContain("@talent");
    expect(result.twitterText).toContain("paid forward 100 percent");
    expect(result.twitterText).toContain("@TalentProtocol");
  });
});

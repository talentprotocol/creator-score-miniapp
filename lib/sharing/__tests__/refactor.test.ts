/**
 * Test to verify the refactored sharing system structure
 * Ensures all imports work correctly from the new consolidated files
 */

// Test single import from index
import {
  ShareContentGenerators,
  PlatformSharing,
  createShareAnalytics,
  generateShareUrl,
  sanitizeFilename,
  type ShareContext,
  type ShareAnalytics,
} from "../index";

describe("Refactored Sharing System", () => {
  it("should export all necessary functions and types from index", () => {
    // Test function exports
    expect(typeof ShareContentGenerators.badge).toBe("function");
    expect(typeof ShareContentGenerators.profile).toBe("function");
    expect(typeof ShareContentGenerators.optout).toBe("function");

    expect(typeof PlatformSharing.shareToFarcaster).toBe("function");
    expect(typeof PlatformSharing.shareToTwitter).toBe("function");
    expect(typeof PlatformSharing.copyLink).toBe("function");
    expect(typeof PlatformSharing.downloadImage).toBe("function");

    expect(typeof createShareAnalytics).toBe("function");
    expect(typeof generateShareUrl).toBe("function");
    expect(typeof sanitizeFilename).toBe("function");
  });

  it("should work with consolidated imports", () => {
    // Test that we can create share content with the new structure
    const context: ShareContext = {
      talentUUID: "test-uuid",
      handle: "testuser",
      appClient: "browser",
    };

    const analytics: ShareAnalytics = {
      eventPrefix: "test_share",
      metadata: { share_type: "profile" },
    };

    // Test utility functions
    const url = generateShareUrl("testuser", "test");
    expect(url).toBe("https://creatorscore.app/testuser#test");

    const filename = sanitizeFilename("test file!.png");
    expect(filename).toBe("test-file-.png");

    // Test analytics creation
    const { eventName, eventData } = createShareAnalytics(
      "opened",
      context,
      analytics,
    );
    expect(eventName).toBe("test_share_opened");
    expect(eventData.talent_uuid).toBe("test-uuid");
  });
});

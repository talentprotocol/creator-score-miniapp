/**
 * Tests for sharing utilities
 */

import {
  getPublicProfileIdentifier,
  sanitizeFilename,
  resolveImageUrl,
  generateShareUrl,
  createShareAnalytics,
  generateAltText,
} from "../utils";

describe("getPublicProfileIdentifier", () => {
  it("should prefer fname when available", () => {
    const result = getPublicProfileIdentifier({
      fname: "testuser",
      talentUUID: "uuid-123",
    });
    expect(result).toBe("testuser");
  });

  it("should fallback to talentUUID when fname is empty", () => {
    const result = getPublicProfileIdentifier({
      fname: "",
      talentUUID: "uuid-123",
    });
    expect(result).toBe("uuid-123");
  });

  it("should fallback to talentUUID when fname is null", () => {
    const result = getPublicProfileIdentifier({
      fname: null,
      talentUUID: "uuid-123",
    });
    expect(result).toBe("uuid-123");
  });
});

describe("sanitizeFilename", () => {
  it("should replace unsafe characters with dashes", () => {
    const result = sanitizeFilename("test file!@#$.png");
    expect(result).toBe("test-file----.png");
  });

  it("should collapse multiple dashes", () => {
    const result = sanitizeFilename("test---file.png");
    expect(result).toBe("test-file.png");
  });

  it("should remove leading and trailing dashes", () => {
    const result = sanitizeFilename("-test-file-.png");
    expect(result).toBe("test-file-.png");
  });

  it("should convert to lowercase", () => {
    const result = sanitizeFilename("TestFile.PNG");
    expect(result).toBe("testfile.png");
  });

  it("should limit length to 100 characters", () => {
    const longName = "a".repeat(150) + ".png";
    const result = sanitizeFilename(longName);
    expect(result.length).toBeLessThanOrEqual(100);
  });
});

describe("resolveImageUrl", () => {
  it("should return absolute URLs unchanged", () => {
    const url = "https://example.com/image.png";
    const result = resolveImageUrl(url);
    expect(result).toBe(url);
  });

  it("should prepend base URL to relative paths", () => {
    const result = resolveImageUrl("/api/image", "https://example.com");
    expect(result).toBe("https://example.com/api/image");
  });

  it("should handle relative paths without leading slash", () => {
    const result = resolveImageUrl("api/image", "https://example.com");
    expect(result).toBe("https://example.com/api/image");
  });
});

describe("generateShareUrl", () => {
  it("should generate basic profile URL", () => {
    const result = generateShareUrl("testuser");
    expect(result).toBe("https://creatorscore.app/testuser");
  });

  it("should add fragment when provided", () => {
    const result = generateShareUrl("testuser", "badges");
    expect(result).toBe("https://creatorscore.app/testuser#badges");
  });

  it("should encode handle properly", () => {
    const result = generateShareUrl("test user");
    expect(result).toBe("https://creatorscore.app/test%20user");
  });
});

describe("createShareAnalytics", () => {
  const context = {
    talentUUID: "uuid-123",
    handle: "testuser",
    appClient: "browser",
  };

  const analytics = {
    eventPrefix: "badge_share",
    metadata: {
      share_type: "badge",
      badge_slug: "test-badge",
    },
  };

  it("should create proper event name and data", () => {
    const result = createShareAnalytics("opened", context, analytics);

    expect(result.eventName).toBe("badge_share_opened");
    expect(result.eventData).toMatchObject({
      talent_uuid: "uuid-123",
      handle: "testuser",
      share_type: "badge",
      badge_slug: "test-badge",
    });
  });
});

describe("generateAltText", () => {
  it("should generate badge alt text with level", () => {
    const result = generateAltText("badge", {
      badge_level: 3,
      badge_title: "Creator Score",
    });
    expect(result).toBe("Creator Badge: Creator Score Level 3");
  });

  it("should generate badge alt text without level", () => {
    const result = generateAltText("badge", {
      badge_title: "Creator Score",
    });
    expect(result).toBe("Creator Badge: Creator Score");
  });

  it("should generate profile alt text", () => {
    const result = generateAltText("profile");
    expect(result).toBe("Creator Score Profile Share Preview");
  });

  it("should generate default alt text for unknown types", () => {
    const result = generateAltText("unknown");
    expect(result).toBe("Share Preview");
  });
});

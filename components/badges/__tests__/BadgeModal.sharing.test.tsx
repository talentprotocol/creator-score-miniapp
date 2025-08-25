/**
 * Tests for BadgeModal sharing functionality
 * Verifies the integration between BadgeModal and the new sharing system
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BadgeModal } from "../BadgeModal";
import type { BadgeState } from "@/app/services/badgesService";

// Mock the sharing system and dependencies
jest.mock("@/lib/sharing", () => ({
  ShareContentGenerators: {
    badge: jest.fn(() => ({
      type: "badge",
      title: "Share Your Badge",
      description: "Share your Creator Score achievement.",
      imageUrl: "/badge-artwork.png",
      filename: "testuser-creator-score-badge.png",
      url: "https://creatorscore.app/testuser#badges",
      farcasterText: "Just earned Level 3 in Creator Score! 🏆",
      twitterText: "Just earned Level 3 in Creator Score! 🏆",
    })),
  },
}));

jest.mock("@/components/modals/ShareModal", () => ({
  ShareModal: ({
    open,
    content,
  }: {
    open: boolean;
    content: { title: string };
  }) =>
    open ? (
      <div data-testid="share-modal">Share Modal: {content.title}</div>
    ) : null,
}));

jest.mock("@coinbase/onchainkit/minikit", () => ({
  useMiniKit: () => ({ context: {} }),
}));

jest.mock("@/lib/utils", () => ({
  detectClient: jest.fn().mockResolvedValue("browser"),
  formatCompactNumber: jest.fn((num) => num.toString()),
}));

jest.mock("@/lib/badge-content", () => ({
  getBadgeContent: jest.fn(() => ({
    levelThresholds: [0, 100, 500, 1000],
    uom: "points",
    isStreakBadge: false,
  })),
}));

jest.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: jest.fn(() => false), // Default to mobile
}));

const mockEarnedBadge: BadgeState = {
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

const mockLockedBadge: BadgeState = {
  ...mockEarnedBadge,
  currentLevel: 0,
  levelLabel: "Locked",
  progressPct: 0,
};

describe("BadgeModal Sharing Integration", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show share button for earned badges with user context", () => {
    render(
      <BadgeModal
        badge={mockEarnedBadge}
        onClose={mockOnClose}
        talentUUID="test-uuid-123"
        handle="testuser"
      />,
    );

    const shareButton = screen.getByRole("button", { name: /share badge/i });
    expect(shareButton).toBeInTheDocument();
  });

  it("should show 'lets do this' button for locked badges", () => {
    render(
      <BadgeModal
        badge={mockLockedBadge}
        onClose={mockOnClose}
        talentUUID="test-uuid-123"
        handle="testuser"
      />,
    );

    const button = screen.getByRole("button", { name: /let's do this/i });
    expect(button).toBeInTheDocument();
  });

  it("should open share modal when clicking share button on earned badge", () => {
    render(
      <BadgeModal
        badge={mockEarnedBadge}
        onClose={mockOnClose}
        talentUUID="test-uuid-123"
        handle="testuser"
      />,
    );

    const shareButton = screen.getByRole("button", { name: /share badge/i });
    fireEvent.click(shareButton);

    const shareModal = screen.getByTestId("share-modal");
    expect(shareModal).toBeInTheDocument();
    expect(shareModal).toHaveTextContent("Share Modal: Share Your Badge");
  });

  it("should close main modal when clicking button without user context", () => {
    render(
      <BadgeModal
        badge={mockEarnedBadge}
        onClose={mockOnClose}
        // No talentUUID or handle provided
      />,
    );

    const button = screen.getByRole("button", { name: /share badge/i });
    fireEvent.click(button);

    expect(mockOnClose).toHaveBeenCalled();
    expect(screen.queryByTestId("share-modal")).not.toBeInTheDocument();
  });

  it("should close main modal when clicking locked badge button", () => {
    render(
      <BadgeModal
        badge={mockLockedBadge}
        onClose={mockOnClose}
        talentUUID="test-uuid-123"
        handle="testuser"
      />,
    );

    const button = screen.getByRole("button", { name: /let's do this/i });
    fireEvent.click(button);

    expect(mockOnClose).toHaveBeenCalled();
    expect(screen.queryByTestId("share-modal")).not.toBeInTheDocument();
  });

  it("should not render share modal when user context is missing", () => {
    render(
      <BadgeModal
        badge={mockEarnedBadge}
        onClose={mockOnClose}
        // Missing user context
      />,
    );

    // Share modal should not be rendered without user context
    expect(screen.queryByTestId("share-modal")).not.toBeInTheDocument();
  });

  it("should generate correct share content for earned badges", async () => {
    const { ShareContentGenerators } = await import("@/lib/sharing");

    render(
      <BadgeModal
        badge={mockEarnedBadge}
        onClose={mockOnClose}
        talentUUID="test-uuid-123"
        handle="testuser"
      />,
    );

    const shareButton = screen.getByRole("button", { name: /share badge/i });
    fireEvent.click(shareButton);

    expect(ShareContentGenerators.badge).toHaveBeenCalledWith(
      {
        talentUUID: "test-uuid-123",
        handle: "testuser",
        appClient: "browser",
      },
      mockEarnedBadge,
    );
  });
});

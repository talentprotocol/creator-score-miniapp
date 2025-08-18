/**
 * BADGE CONTENT CONFIGURATION
 *
 * This file contains all badge-related content, descriptions, and thresholds.
 * Separating content from business logic makes it easier to manage copy,
 * enable localization, and perform A/B testing without touching core logic.
 */

/**
 * BadgeContent
 * - slug: canonical identifier for the badge family (e.g., "creator-score", "total-earnings") used in URLs and asset paths
 * - title: human-readable badge family title shown in UI (e.g., "Creator Score")
 * - description: copy template supporting placeholders like {level} and {amount} to render per-level descriptions
 * - thresholds: ordered numeric thresholds for each level within the badge family (min values or counts)
 * - labels: human-facing names for each level (e.g., "40-79", "1K", "3 Days"); must align by index with thresholds
 * - uom: optional unit of measure to display with values (e.g., "USD", "followers", "$TALENT", "days")
 */
export interface BadgeContent {
  slug: string;
  title: string;
  description: string;
  thresholds: number[];
  labels: string[];
  uom?: string;
}

export interface BadgeSectionContent {
  id: string;
  title: string;
  description?: string;
}

// Top-level Section definitions (UI groups)
export const BADGE_SECTIONS: BadgeSectionContent[] = [
  {
    id: "trophies",
    title: "Trophies",
    description: "Milestone achievements like Creator Score levels and streaks",
  },
  {
    id: "metrics",
    title: "Metrics",
    description: "Cross-platform totals such as earnings and followers",
  },
  {
    id: "platforms",
    title: "Platforms",
    description: "Activity and impact on specific platforms",
  },
];

// Individual badge definitions
export const BADGE_CONTENT: Record<string, BadgeContent> = {
  "creator-score": {
    slug: "creator-score",
    title: "Creator Score",
    description: "Reach Creator Score {level}",
    // thresholds are the minimum score for each range
    thresholds: [0, 40, 80, 120, 170, 250],
    labels: [
      "0-39 Points",
      "40-79 Points",
      "80-119 Points",
      "120-169 Points",
      "170-249 Points",
      "250+ Points",
    ],
    uom: "points",
  },

  streaks: {
    slug: "streaks",
    title: "Streaks",
    description: "Maintain a {level} day streak",
    thresholds: [1, 2, 3, 4, 5, 6], // consecutive days
    labels: [
      "1 Day Streak",
      "2 Day Streak",
      "3 Day Streak",
      "4 Day Streak",
      "5 Day Streak",
      "6 Day Streak",
    ],
    uom: "days",
  },

  "total-earnings": {
    slug: "total-earnings",
    title: "Total Earnings",
    description: "Earn ${amount} from your content",
    thresholds: [10, 100, 1000, 10000, 25000, 100000],
    labels: [
      "$10 Earned",
      "$100 Earned",
      "$1K Earned",
      "$10K Earned",
      "$25K Earned",
      "$100K Earned",
    ],
    uom: "USD",
  },

  "total-followers": {
    slug: "total-followers",
    title: "Total Followers",
    description: "Reach {amount} followers across all platforms",
    thresholds: [100, 1000, 10000, 25000, 100000, 250000],
    labels: [
      "100 Followers",
      "1K Followers",
      "10K Followers",
      "25K Followers",
      "100K Followers",
      "250K Followers",
    ],
    uom: "followers",
  },

  talent: {
    slug: "talent",
    title: "Talent Protocol",
    description: "Hold {amount} $TALENT tokens",
    thresholds: [100, 1000, 10000],
    labels: ["100 $TALENT", "1K $TALENT", "10K $TALENT"],
    uom: "$TALENT",
  },

  base: {
    slug: "base",
    title: "Base Network",
    description: "Make {amount}+ transactions on Base",
    thresholds: [10, 100, 1000],
    labels: ["10 Transactions", "100 Transactions", "1K Transactions"],
    uom: "transactions",
  },

  reown: {
    slug: "reown",
    title: "Reown",
    description: "Earn {amount} $WCT from wallet connect airdrop",
    thresholds: [1, 10, 100],
    labels: ["1 $WCT", "10 $WCT", "100 $WCT"],
    uom: "$WCT",
  },
};

// Helper functions for content management
export function getBadgeContent(slug: string): BadgeContent | undefined {
  return BADGE_CONTENT[slug];
}

export function getBadgeSectionContent(
  sectionId: string,
): BadgeSectionContent | undefined {
  return BADGE_SECTIONS.find((section) => section.id === sectionId);
}

export function getAllBadgeSlugs(): string[] {
  return Object.keys(BADGE_CONTENT);
}

export function getBadgeThresholds(slug: string): number[] {
  return BADGE_CONTENT[slug]?.thresholds || [];
}

export function getBadgeLabels(slug: string): string[] {
  return BADGE_CONTENT[slug]?.labels || [];
}

export function getBadgeUOM(slug: string): string | undefined {
  return BADGE_CONTENT[slug]?.uom;
}

export function formatBadgeDescription(
  slug: string,
  level: number,
  amount?: string | number,
): string {
  const content = BADGE_CONTENT[slug];
  if (!content) return "";

  let description = content.description;

  // Replace placeholders with actual values
  if (description.includes("{level}")) {
    description = description.replace("{level}", level.toString());
  }

  if (description.includes("{amount}")) {
    const displayAmount = amount || content.labels[level - 1] || "";
    description = description.replace("{amount}", displayAmount.toString());
  }

  return description;
}

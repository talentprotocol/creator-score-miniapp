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
 * - levelThresholds: ordered numeric thresholds for each level within the badge family (min values or counts)
 * - levelLabels: human-facing names for each level (e.g., "40-79", "1K", "3 Days"); must align by index with levelThresholds
 * - uom: optional unit of measure to display with values (e.g., "USD", "followers", "$TALENT", "days")
 */
export interface BadgeContent {
  slug: string;
  title: string;
  description: string;
  levelThresholds: number[];
  levelLabels: string[];
  uom?: string;
  isStreakBadge?: boolean;
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
    description:
      "Celebrate your dedication with badges for consistent app engagement",
  },
  {
    id: "records",
    title: "Records",
    description:
      "Unlock badges based on your quantitative creator metrics and milestones",
  },
  {
    id: "special",
    title: "Special",
    description:
      "Exclusive badges with rewards from brand partnerships and special events",
  },
  {
    id: "accounts",
    title: "Accounts",
    description:
      "Badges for building a presence across popular creator platforms",
  },
  {
    id: "content",
    title: "Content",
    description:
      "Badges for creator earnings coming from different types of creative work",
  },
];

// Individual badge definitions
export const BADGE_CONTENT: Record<string, BadgeContent> = {
  "creator-score": {
    slug: "creator-score",
    title: "Creator Score",
    description:
      "Increase your Creator Score to go from Rookie Creator (0-39 points) to Legendary Creator (250+ points)!",
    // levelThresholds are the minimum score for each range
    levelThresholds: [0, 40, 80, 120, 170, 250],
    levelLabels: [
      "Rookie Creator",
      "Rising Creator",
      "Skilled Creator",
      "Expert Creator",
      "Master Creator",
      "Legendary Creator",
    ],
    uom: "pts",
  },

  "daily-streaks": {
    slug: "daily-streaks",
    title: "Daily Streaks",
    description: "Visit the app every day to keep your daily streak alive.",
    levelThresholds: [1, 2, 3, 4, 5, 6],
    levelLabels: [
      "1 Day Streak",
      "2 Day Streak",
      "3 Day Streak",
      "4 Day Streak",
      "5 Day Streak",
      "6 Day Streak",
    ],
    uom: "days",
    isStreakBadge: true,
  },

  "weekly-streaks": {
    slug: "weekly-streaks",
    title: "Weekly Streaks",
    description: "Visit the app every week to maintain your weekly streak.",
    levelThresholds: [1, 2, 3, 4, 5, 6],
    levelLabels: [
      "1 Week Streak",
      "2 Week Streak",
      "3 Week Streak",
      "4 Week Streak",
      "5 Week Streak",
      "6 Week Streak",
    ],
    uom: "weeks",
    isStreakBadge: true,
  },

  "total-earnings": {
    slug: "total-earnings",
    title: "Total Earnings",
    description:
      "Track your Total Earnings with badges from $10 (Level 1) to $100K+ (Level 6).",
    levelThresholds: [10, 100, 1000, 10000, 25000, 100000],
    levelLabels: [
      "$10+ Earned",
      "$100+ Earned",
      "$1K+ Earned",
      "$10K+ Earned",
      "$25K+ Earned",
      "$100K+ Earned",
    ],
    uom: "USD",
  },

  "total-followers": {
    slug: "total-followers",
    title: "Total Followers",
    description:
      "Grow your audience from 100 to 250K+ Total Followers to unlock all 6 badge levels!",
    levelThresholds: [100, 1000, 10000, 25000, 100000, 250000],
    levelLabels: [
      "100+ Followers",
      "1K+ Followers",
      "10K+ Followers",
      "25K+ Followers",
      "100K+ Followers",
      "250K+ Followers",
    ],
    uom: "followers",
  },

  "total-collectors": {
    slug: "total-collectors",
    title: "Total Collectors",
    description:
      "Build your collector base from 10 to 10K+ Total Collectors across all platforms!",
    levelThresholds: [10, 50, 100, 500, 1000, 10000],
    levelLabels: [
      "10+ Collectors",
      "50+ Collectors",
      "100+ Collectors",
      "500+ Collectors",
      "1K+ Collectors",
      "10K+ Collectors",
    ],
    uom: "collectors",
  },

  "pay-it-forward": {
    slug: "pay-it-forward",
    title: "Pay It Forward",
    description:
      "Help grow the creator economy by opting out of rewards and letting them flow to emerging creators!",
    levelThresholds: [1],
    levelLabels: ["Paid Forward"],
    uom: "actions",
  },

  talent: {
    slug: "talent",
    title: "Talent Protocol",
    description:
      "Unlock 3 Talent Protocol badges: 100, 1K, and 10K+ $TALENT tokens!",
    levelThresholds: [100, 1000, 10000],
    levelLabels: ["100+ $TALENT", "1K+ $TALENT", "10K+ $TALENT"],
    uom: "$TALENT",
  },

  base: {
    slug: "base",
    title: "Base Network",
    description: "Earn 3 Base badges by making 10, 100, and 1K+ transactions!",
    levelThresholds: [10, 100, 1000],
    levelLabels: ["10+ Base txs", "100+ Base txs", "1K+ Base txs"],
    uom: "transactions",
  },
};

// Badge section threshold configuration
export const BADGE_SECTION_THRESHOLD = 18;

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

export function getAllBadgeSections(): BadgeSectionContent[] {
  return BADGE_SECTIONS;
}

export function getBadgeLevelThresholds(slug: string): number[] {
  return BADGE_CONTENT[slug]?.levelThresholds || [];
}

export function getBadgeLevelLabels(slug: string): string[] {
  return BADGE_CONTENT[slug]?.levelLabels || [];
}

// Helper functions for 1-based level access
export function getBadgeLevelThreshold(
  slug: string,
  level: number,
): number | undefined {
  const thresholds = getBadgeLevelThresholds(slug);
  return thresholds[level - 1]; // Convert 1-based level to 0-based array index
}

export function getBadgeLevelLabel(
  slug: string,
  level: number,
): string | undefined {
  const labels = getBadgeLevelLabels(slug);
  return labels[level - 1]; // Convert 1-based level to 0-based array index
}

export function getBadgeMaxLevel(slug: string): number {
  return getBadgeLevelThresholds(slug).length;
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
    const displayAmount = amount || content.levelLabels[level - 1] || "";
    description = description.replace("{amount}", displayAmount.toString());
  }

  return description;
}

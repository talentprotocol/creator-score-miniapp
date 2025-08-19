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
}

export interface BadgeSectionContent {
  id: string;
  title: string;
  description?: string;
}

// Top-level Section definitions (UI groups)
export const BADGE_SECTIONS: BadgeSectionContent[] = [
  {
    id: "creator-score",
    title: "Creator Score",
    description: "Achievement levels based on your Creator Score points",
  },
  {
    id: "streaks",
    title: "Streaks",
    description: "Daily activity and consistency milestones",
  },
  {
    id: "records",
    title: "Records",
    description: "Cross-platform totals such as earnings and followers",
  },
  {
    id: "communities",
    title: "Communities",
    description: "Activity and impact on specific platforms",
  },
];

// Individual badge definitions
export const BADGE_CONTENT: Record<string, BadgeContent> = {
  "creator-score": {
    slug: "creator-score",
    title: "Creator Score",
    description: "Reach Creator Score {level}",
    // levelThresholds are the minimum score for each range
    levelThresholds: [0, 40, 80, 120, 170, 250],
    levelLabels: [
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
    levelThresholds: [1, 2, 3, 4, 5, 6], // consecutive days
    levelLabels: [
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
    levelThresholds: [10, 100, 1000, 10000, 25000, 100000],
    levelLabels: [
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
    levelThresholds: [100, 1000, 10000, 25000, 100000, 250000],
    levelLabels: [
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
    levelThresholds: [100, 1000, 10000],
    levelLabels: ["100 $TALENT", "1K $TALENT", "10K $TALENT"],
    uom: "$TALENT",
  },

  base: {
    slug: "base",
    title: "Base Network",
    description: "Make {amount}+ transactions on Base",
    levelThresholds: [10, 100, 1000],
    levelLabels: ["10 Base txs", "100 Base txs", "1K Base txs"],
    uom: "transactions",
  },

  // TODO: WCT badges temporarily disabled - community not confirmed yet
  // reown: {
  //   slug: "reown",
  //   title: "Reown",
  //   description: "Earn {amount} $WCT from wallet connect airdrop",
  //   levelThresholds: [1, 10, 100],
  //   levelLabels: ["1 $WCT", "10 $WCT", "100 $WCT"],
  //   uom: "$WCT",
  // },
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

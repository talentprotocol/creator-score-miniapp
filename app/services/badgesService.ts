import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";
import { LEVEL_RANGES } from "@/lib/constants";
import { getCreatorScoreForTalentId } from "./scoresService";
import { getSocialAccountsForTalentId } from "./socialAccountsService";
import { getCachedUserTokenBalance } from "./tokenBalanceService";
import { getCredentialsForTalentId } from "./credentialsService";
import { getDataPointsSum } from "./dataPointsService";

import {
  getBadgeContent,
  getAllBadgeSections,
  formatBadgeDescription,
} from "@/lib/badge-content";
import { calculateTotalRewards, getEthUsdcPrice } from "@/lib/utils";

/**
 * BADGES SERVICE
 *
 * This service implements a compute-on-read MVP for the Creator Score Badges feature.
 * It calculates badge eligibility, progress, and states based on existing user data
 * from various Talent API endpoints, with 5-minute server-side caching.
 *
 * Architecture:
 * - Uses existing services (scores, social accounts, token balance, credentials)
 * - Computes badge states on-demand (no new database tables)
 * - Caches results for 5 minutes using unstable_cache
 * - Returns structured badge data with progress calculations
 *
 * Badge Categories:
 * 1. Trophies: Creator Score level-based achievements
 * 2. Metrics: Total Earnings and Total Followers milestones
 * 3. Platforms: $TALENT balance and Base transaction achievements (currently disabled)
 */

// Types for badge system (updated for dynamic single-badge approach)
export interface BadgeState {
  badgeSlug: string; // Badge family identifier (e.g., "creator-score", "total-earnings")
  title: string; // Badge category title (e.g., "Creator Score", "Total Followers")
  currentLevel: number; // 0 = locked, 1+ = earned level
  maxLevel: number; // Total number of levels
  isMaxLevel: boolean;
  levelLabel: string; // Current level display (e.g., "Level 3", "1K Followers")
  progressLabel: string; // Progress to next level (e.g., "50 left", "Max Level")
  progressPct: number; // Progress percentage (0-100)
  artworkUrl: string; // Current artwork URL
  description: string;
  categoryName: string; // Badge category name
}

export interface BadgeSection {
  id: string;
  title: string;
  badges: BadgeState[];
}

export interface BadgesResponse {
  sections: BadgeSection[];
  summary: {
    earnedCount: number;
    totalCount: number;
    completionPct: number;
  };
}

/**
 * UTILITY FUNCTIONS
 * Helper functions for parsing user data and formatting display values
 */

/** Format numbers with smart rounding: round up if .5 or above, round down otherwise */
function formatNumberSmart(value: number): string {
  if (value >= 1000000) {
    const millions = value / 1000000;
    if (millions < 10) {
      // 1-digit M: always show 2 decimals
      return `${millions.toFixed(2)}M`;
    } else {
      // 2+ digit M: show max 1 decimal
      const rounded = Math.round(millions * 10) / 10;
      return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}M`;
    }
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    if (thousands < 10) {
      // 1-digit K: always show 2 decimals
      return `${thousands.toFixed(2)}K`;
    } else {
      // 2+ digit K: show max 1 decimal
      const rounded = Math.round(thousands * 10) / 10;
      return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}K`;
    }
  }
  return value.toString();
}

/** Format currency values with smart rounding and $ prefix */
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    const millions = value / 1000000;
    if (millions < 10) {
      // 1-digit M: always show 2 decimals
      return `$${millions.toFixed(2)}M`;
    } else {
      // 2+ digit M: show max 1 decimal
      const rounded = Math.round(millions * 10) / 10;
      return `$${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}M`;
    }
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    if (thousands < 10) {
      // 1-digit K: always show 2 decimals
      return `$${thousands.toFixed(2)}K`;
    } else {
      // 2+ digit K: show max 1 decimal
      const rounded = Math.round(thousands * 10) / 10;
      return `$${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}K`;
    }
  }
  return `$${value}`;
}

/** Clamp a percentage value to the valid range 0-100 */
function clampToPct(x: number): number {
  return Math.max(0, Math.min(100, x));
}

/** Format progress label based on badge type and state */

function getBadgeArtworkUrl(badgeSlug: string, currentLevel: number): string {
  const basePath = `/images/badges/${badgeSlug}`;

  if (currentLevel === 0) {
    return `${basePath}/${badgeSlug}-1-locked.webp`;
  } else {
    return `${basePath}/${badgeSlug}-${currentLevel}-earned.webp`;
  }
}

// Helper function to create dynamic badge
function createDynamicBadge(
  content: {
    slug: string;
    title: string;
    levelLabels: string[];
  },
  currentValue: number,
  thresholds: number[],
  formatMissing: (missing: number) => string,
): BadgeState {
  // Find current level
  let currentLevel = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (currentValue >= thresholds[i]) {
      currentLevel = i + 1;
      break;
    }
  }

  const maxLevel = thresholds.length;
  const isMaxLevel = currentLevel >= maxLevel;

  // Calculate progress and label
  let progressPct = 0;
  let progressLabel = "";
  if (isMaxLevel) {
    progressPct = 100;
    progressLabel = "Max Level";
  } else {
    const nextThreshold = thresholds[currentLevel];
    if (currentLevel === 0) {
      progressPct = clampToPct((currentValue / nextThreshold) * 100);
    } else {
      const prevThreshold = thresholds[currentLevel - 1];
      const range = nextThreshold - prevThreshold;
      const progress = currentValue - prevThreshold;
      progressPct = clampToPct((progress / range) * 100);
    }
    const missing = nextThreshold - currentValue;
    progressLabel = formatMissing(missing);
  }

  // Get level label
  const levelLabel =
    currentLevel === 0
      ? content.levelLabels[0]
      : content.levelLabels[currentLevel - 1];

  return {
    badgeSlug: content.slug,
    title: content.title,
    currentLevel,
    maxLevel,
    isMaxLevel,
    levelLabel,
    progressLabel,
    progressPct,
    artworkUrl: getBadgeArtworkUrl(content.slug, currentLevel),
    description: formatBadgeDescription(
      content.slug,
      currentLevel || 1,
      levelLabel,
    ),
    categoryName: content.title,
  };
}

// Helper function to create streak badges (no progress bars needed)
function createStreakBadge(
  content: {
    slug: string;
    title: string;
    levelLabels: string[];
  },
  currentValue: number,
  thresholds: number[],
): BadgeState {
  // Find current level
  let currentLevel = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (currentValue >= thresholds[i]) {
      currentLevel = i + 1;
      break;
    }
  }

  const maxLevel = thresholds.length;
  const isMaxLevel = currentLevel >= maxLevel;

  // Get level label
  const levelLabel =
    currentLevel === 0
      ? content.levelLabels[0]
      : content.levelLabels[currentLevel - 1];

  return {
    badgeSlug: content.slug,
    title: content.title,
    currentLevel,
    maxLevel,
    isMaxLevel,
    levelLabel,
    progressLabel: "", // No progress label for streaks
    progressPct: currentLevel > 0 ? 100 : 0, // 100% if earned, 0% if locked
    artworkUrl: getBadgeArtworkUrl(content.slug, currentLevel),
    description: formatBadgeDescription(
      content.slug,
      currentLevel || 1,
      levelLabel,
    ),
    categoryName: content.title,
  };
}

// Badge computation functions (updated for single dynamic badges)
async function computeCreatorScoreBadges(
  talentUuid: string,
): Promise<BadgeState[]> {
  const scoreData = await getCreatorScoreForTalentId(talentUuid)();
  const score = scoreData.score || 0;
  const content = getBadgeContent("creator-score");

  if (!content) return [];

  const thresholds = LEVEL_RANGES.map((range) => range.min);
  const badge = createDynamicBadge(
    content,
    score,
    thresholds,
    (missing) => `${missing} points left`,
  );

  return [badge];
}

async function computeTotalEarningsBadges(
  talentUuid: string,
): Promise<BadgeState[]> {
  const credentials = await getCredentialsForTalentId(talentUuid);
  const content = getBadgeContent("total-earnings");

  if (!content) return [];

  // Transform credentials to match calculateTotalRewards signature
  const transformedCredentials = credentials.flatMap((group) =>
    group.points.map((point) => ({
      slug: point.slug,
      readable_value: point.readable_value,
      uom: point.uom,
    })),
  );

  // Use the shared calculateTotalRewards function for consistent earnings calculation
  const totalEarnings = await calculateTotalRewards(
    transformedCredentials,
    getEthUsdcPrice,
  );

  const badge = createDynamicBadge(
    content,
    totalEarnings,
    content.levelThresholds,
    (missing) => `${formatCurrency(missing)} left`,
  );

  return [badge];
}

async function computeTotalFollowersBadges(
  talentUuid: string,
): Promise<BadgeState[]> {
  const socials = await getSocialAccountsForTalentId(talentUuid)();
  const totalFollowers = socials.reduce((sum, social) => {
    return sum + (social.followerCount || 0);
  }, 0);

  const content = getBadgeContent("total-followers");
  if (!content) return [];

  const badge = createDynamicBadge(
    content,
    totalFollowers,
    content.levelThresholds,
    (missing) => `${formatNumberSmart(missing)} left`,
  );

  return [badge];
}

async function computeDailyStreaksBadges(
  _talentUuid: string, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<BadgeState[]> {
  // TODO: Implement daily streaks logic when we have the data source
  const content = getBadgeContent("daily-streaks");
  if (!content) return [];

  // For now, use 0 as current streak days to show correct progress format
  const currentStreakDays = 0; // TODO: Replace with actual daily streak calculation

  const badge = createStreakBadge(
    content,
    currentStreakDays,
    content.levelThresholds,
  );

  return [badge];
}

async function computeWeeklyStreaksBadges(
  _talentUuid: string, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<BadgeState[]> {
  // TODO: Implement weekly streaks logic when we have the data source
  const content = getBadgeContent("weekly-streaks");
  if (!content) return [];

  // For now, use 0 as current streak weeks to show correct progress format
  const currentStreakWeeks = 0; // TODO: Replace with actual weekly streak calculation

  const badge = createStreakBadge(
    content,
    currentStreakWeeks,
    content.levelThresholds,
  );

  return [badge];
}

async function computePlatformTalentBadges(
  talentUuid: string,
): Promise<BadgeState[]> {
  const content = getBadgeContent("talent");
  if (!content) return [];

  // Use existing token balance service for $TALENT balance
  if (!process.env.TALENT_API_KEY) {
    return [];
  }

  const getCachedBalance = getCachedUserTokenBalance(talentUuid);
  const talentBalance = await getCachedBalance(process.env.TALENT_API_KEY);

  const badge = createDynamicBadge(
    content,
    talentBalance,
    content.levelThresholds,
    (missing) => `${formatNumberSmart(missing)} tokens left`,
  );

  return [badge];
}

async function computePlatformBaseBadges(
  talentUuid: string,
): Promise<BadgeState[]> {
  const content = getBadgeContent("base");
  if (!content) return [];

  // Use generic data points service to get base_out_transactions sum
  const baseTxCount = await getDataPointsSum(talentUuid, [
    "base_out_transactions",
  ]);

  const badge = createDynamicBadge(
    content,
    baseTxCount,
    content.levelThresholds,
    (missing) => `${formatNumberSmart(missing)} left`,
  );

  return [badge];
}

// TODO: WCT badges temporarily disabled - community not confirmed yet
// async function computePlatformReownBadges(
//   talentUuid: string,
// ): Promise<BadgeState[]> {
//   const content = getBadgeContent("reown");
//   if (!content) return [];

//   // Get wallet_connect_airdrop_one data point
//   // TODO: Replace with actual data point when available
//   const reownTaskCount = await getDataPointsSum(talentUuid, [
//     "wallet_connect_airdrop_one",
//   ]);

//   const maxLevel = getBadgeMaxLevel("reown");
//   const uom = getBadgeUOM("reown");
//   const badges: BadgeState[] = [];

//   for (let badgeLevel = 1; badgeLevel <= maxLevel; badgeLevel++) {
//     const threshold = getBadgeLevelThreshold("reown", badgeLevel);
//     const levelLabel = getBadgeLevelLabel("reown", badgeLevel);

//     if (!threshold || !levelLabel) continue;

//     const earned = reownTaskCount >= threshold;
//     const progress = earned
//       ? 100
//       : clampToPct((reownTaskCount / threshold) * 100);

//     badges.push({
//       badgeSlug: content.slug,
//       badgeLevel: badgeLevel,
//       title: levelLabel,
//       description: formatBadgeDescription(content.slug, badgeLevel, levelLabel),
//       state: (earned ? "earned" : "locked") as "earned" | "locked",
//       progressLabel: formatProgressLabel(
//         earned ? "earned" : "locked",
//         content.slug,
//         reownTaskCount,
//         threshold,
//         uom,
//       ),
//       progressPct: progress,
//       levelArtwork: getBadgeLevelArtwork("reown", badgeLevel),
//       categoryName: content.title,
//     });
//   }

//   return badges;
// }

// Main service functions
async function getBadgesForUserUncached(
  talentUuid: string,
): Promise<BadgesResponse> {
  try {
    const [
      creatorScoreBadges,
      totalEarningsBadges,
      totalFollowersBadges,
      dailyStreaksBadges,
      weeklyStreaksBadges,
      platformTalentBadges,
      platformBaseBadges,
      // platformReownBadges, // Temporarily disabled
    ] = await Promise.all([
      computeCreatorScoreBadges(talentUuid),
      computeTotalEarningsBadges(talentUuid),
      computeTotalFollowersBadges(talentUuid),
      computeDailyStreaksBadges(talentUuid),
      computeWeeklyStreaksBadges(talentUuid),
      computePlatformTalentBadges(talentUuid),
      computePlatformBaseBadges(talentUuid),
      // computePlatformReownBadges(talentUuid), // Temporarily disabled
    ]);

    const sections: BadgeSection[] = getAllBadgeSections().map((section) => ({
      id: section.id,
      title: section.title,
      badges: [
        ...(section.id === "creator-score" ? creatorScoreBadges : []),
        ...(section.id === "daily-streaks" ? dailyStreaksBadges : []),
        ...(section.id === "weekly-streaks" ? weeklyStreaksBadges : []),
        ...(section.id === "records"
          ? [...totalEarningsBadges, ...totalFollowersBadges]
          : []),
        ...(section.id === "communities"
          ? [
              ...platformTalentBadges,
              ...platformBaseBadges,
              // ...platformReownBadges, // Temporarily disabled
            ]
          : []),
      ],
    }));

    // Calculate summary - completion based on progress toward max level
    const allBadges = sections.flatMap((section) => section.badges);
    const totalPossibleProgress = allBadges.reduce((total, badge) => {
      return total + badge.maxLevel;
    }, 0);
    const currentProgress = allBadges.reduce((total, badge) => {
      return total + badge.currentLevel;
    }, 0);
    const completionPct =
      totalPossibleProgress > 0
        ? Math.round((currentProgress / totalPossibleProgress) * 100)
        : 0;

    return {
      sections,
      summary: {
        earnedCount: allBadges.filter((badge) => badge.currentLevel > 0).length,
        totalCount: allBadges.length,
        completionPct,
      },
    };
  } catch (error) {
    console.error("[getBadgesForUser] Error:", error);

    // Return empty state on error
    return {
      sections: [],
      summary: {
        earnedCount: 0,
        totalCount: 0,
        completionPct: 0,
      },
    };
  }
}

/**
 * MAIN EXPORT FUNCTIONS
 */

/**
 * Get all badges for a user with 5-minute caching
 * Returns badge sections and summary stats (earned count, completion percentage)
 */
export const getBadgesForUser = unstable_cache(
  getBadgesForUserUncached,
  [CACHE_KEYS.USER_BADGES],
  {
    revalidate: CACHE_DURATION_5_MINUTES,
    tags: [`${CACHE_KEYS.USER_BADGES}`],
  },
);

/**
 * Get detailed information for a specific badge
 * Used by the badge detail modal and individual badge pages
 */
export async function getBadgeDetail(
  talentUuid: string,
  badgeSlug: string,
): Promise<BadgeState | null> {
  try {
    const badgesData = await getBadgesForUser(talentUuid);

    // Find the badge across all sections
    let badge: BadgeState | undefined;
    for (const section of badgesData.sections) {
      badge = section.badges.find((b) => b.badgeSlug === badgeSlug);
      if (badge) break;
    }

    return badge || null;
  } catch (error) {
    console.error("[getBadgeDetail] Error:", error);
    return null;
  }
}

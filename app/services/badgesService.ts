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
  getBadgeLevelThreshold,
  getBadgeLevelLabel,
  getBadgeMaxLevel,
  getBadgeUOM,
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

// Types for badge system
export interface BadgeState {
  badgeSlug: string; // Badge family identifier (e.g., "creator-score", "total-earnings")
  badgeLevel: number; // 1-based level number (1, 2, 3, etc.)
  title: string; // Level label (e.g., "100 $TALENT", "1K Followers")
  description: string;
  state: "earned" | "locked";
  progressLabel: string; // Progress status (e.g., "$50 left", "Earned")
  progressPct: number;
  levelArtwork: {
    earnedUrl: string;
    lockedUrl: string;
  };
  categoryName: string; // Badge category name (e.g., "Creator Score", "Streaks")
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

export interface BadgeDetail {
  badgeSlug: string; // Badge family identifier
  badgeLevel: number; // 1-based level number
  title: string; // Level label
  state: "earned" | "locked";
  progressLabel: string; // Progress status
  progressPct: number;
  earnedLevels?: number;
  peersStat?: {
    text: string;
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
    const rounded = Math.round(millions * 10) / 10;
    return `${rounded}M`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    const rounded = Math.round(thousands * 10) / 10;
    return `${rounded}K`;
  }
  return value.toString();
}

/** Format currency values with smart rounding and $ prefix */
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    const millions = value / 1000000;
    const rounded = Math.round(millions * 10) / 10;
    return `$${rounded}M`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    const rounded = Math.round(thousands * 10) / 10;
    return `$${rounded}K`;
  }
  return `$${value}`;
}

/** Clamp a percentage value to the valid range 0-100 */
function clampToPct(x: number): number {
  return Math.max(0, Math.min(100, x));
}

/** Format progress label based on badge type and state */
function formatProgressLabel(
  state: "earned" | "locked",
  badgeSlug: string,
  current: number,
  threshold?: number,
  uom?: string,
  completionCount?: number,
): string {
  if (state === "earned") {
    // Special case for streaks: show completion count
    if (badgeSlug === "streaks" && completionCount) {
      return `${completionCount}x times`;
    }
    return "Earned";
  }

  if (!threshold) {
    return "Locked";
  }

  const missing = threshold - current;

  // Format based on badge type
  if (badgeSlug === "total-earnings") {
    return `${formatCurrency(missing)} left`;
  } else if (badgeSlug === "total-followers") {
    return `${formatNumberSmart(missing)} left`;
  } else if (badgeSlug === "talent") {
    return `${formatNumberSmart(missing)} tokens left`;
  } else if (badgeSlug === "reown") {
    return `${formatNumberSmart(missing)} tokens left`;
  } else if (badgeSlug === "base") {
    return `${formatNumberSmart(missing)} left`;
  } else if (badgeSlug === "creator-score") {
    return `${missing} points left`;
  } else if (badgeSlug === "streaks") {
    return `${current} of ${threshold} days`;
  }

  // Fallback for other badge types
  if (uom) {
    return `${formatNumberSmart(missing)} ${uom} left`;
  }
  return `${formatNumberSmart(missing)} left`;
}

function getBadgeLevelArtwork(
  badgeSlug: string,
  badgeLevel: number,
): { earnedUrl: string; lockedUrl: string } {
  const basePath = `/images/badges/${badgeSlug}`;
  return {
    earnedUrl: `${basePath}/${badgeSlug}-${badgeLevel}-earned.webp`,
    lockedUrl: `${basePath}/${badgeSlug}-${badgeLevel}-locked.webp`,
  };
}

// Badge computation functions
async function computeCreatorScoreBadges(
  talentUuid: string,
): Promise<BadgeState[]> {
  const scoreData = await getCreatorScoreForTalentId(talentUuid);
  const score = scoreData.score || 0;
  const content = getBadgeContent("creator-score");

  if (!content) return [];

  return LEVEL_RANGES.map((range, index) => {
    const badgeLevel = index + 1; // 1-based level
    const earned = score >= range.min;
    const progress = earned ? 100 : clampToPct((score / range.min) * 100);

    return {
      badgeSlug: content.slug,
      badgeLevel: badgeLevel,
      title: content.levelLabels[index],
      description: formatBadgeDescription(content.slug, badgeLevel),
      state: earned ? "earned" : "locked",
      progressLabel: earned ? "Earned" : `${score} of ${range.min}`,
      progressPct: progress,
      levelArtwork: getBadgeLevelArtwork("creator-score", badgeLevel),
      categoryName: content.title,
    };
  });
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

  const maxLevel = getBadgeMaxLevel("total-earnings");
  const uom = getBadgeUOM("total-earnings");
  const badges: BadgeState[] = [];

  for (let badgeLevel = 1; badgeLevel <= maxLevel; badgeLevel++) {
    const threshold = getBadgeLevelThreshold("total-earnings", badgeLevel);
    const levelLabel = getBadgeLevelLabel("total-earnings", badgeLevel);

    if (!threshold || !levelLabel) continue;

    const earned = totalEarnings >= threshold;
    const progress = earned
      ? 100
      : clampToPct((totalEarnings / threshold) * 100);

    badges.push({
      badgeSlug: content.slug,
      badgeLevel: badgeLevel,
      title: levelLabel,
      description: formatBadgeDescription(content.slug, badgeLevel, levelLabel),
      state: earned ? "earned" : "locked",
      progressLabel: formatProgressLabel(
        earned ? "earned" : "locked",
        content.slug,
        totalEarnings,
        threshold,
        uom,
      ),
      progressPct: progress,
      levelArtwork: getBadgeLevelArtwork("total-earnings", badgeLevel),
      categoryName: content.title,
    });
  }

  return badges;
}

async function computeTotalFollowersBadges(
  talentUuid: string,
): Promise<BadgeState[]> {
  const socials = await getSocialAccountsForTalentId(talentUuid);
  const totalFollowers = socials.reduce((sum, social) => {
    return sum + (social.followerCount || 0);
  }, 0);

  const content = getBadgeContent("total-followers");

  if (!content) return [];

  const maxLevel = getBadgeMaxLevel("total-followers");
  const uom = getBadgeUOM("total-followers");
  const badges: BadgeState[] = [];

  for (let badgeLevel = 1; badgeLevel <= maxLevel; badgeLevel++) {
    const threshold = getBadgeLevelThreshold("total-followers", badgeLevel);
    const levelLabel = getBadgeLevelLabel("total-followers", badgeLevel);

    if (!threshold || !levelLabel) continue;

    const earned = totalFollowers >= threshold;
    const progress = earned
      ? 100
      : clampToPct((totalFollowers / threshold) * 100);

    badges.push({
      badgeSlug: content.slug,
      badgeLevel: badgeLevel,
      title: levelLabel,
      description: formatBadgeDescription(content.slug, badgeLevel, levelLabel),
      state: earned ? "earned" : "locked",
      progressLabel: formatProgressLabel(
        earned ? "earned" : "locked",
        content.slug,
        totalFollowers,
        threshold,
        uom,
      ),
      progressPct: progress,
      levelArtwork: getBadgeLevelArtwork("total-followers", badgeLevel),
      categoryName: content.title,
    });
  }

  return badges;
}

async function computeStreaksBadges(
  _talentUuid: string, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<BadgeState[]> {
  // TODO: Implement streaks logic when we have the data source
  // For now, return empty array until we can compute actual streak data
  const content = getBadgeContent("streaks");

  if (!content) return [];

  const maxLevel = getBadgeMaxLevel("streaks");
  const uom = getBadgeUOM("streaks");
  const badges: BadgeState[] = [];

  // Placeholder: all badges locked until we implement streak calculation
  // For now, use 0 as current streak days to show correct progress format
  const currentStreakDays = 0; // TODO: Replace with actual streak calculation

  for (let badgeLevel = 1; badgeLevel <= maxLevel; badgeLevel++) {
    const threshold = getBadgeLevelThreshold("streaks", badgeLevel);
    const levelLabel = getBadgeLevelLabel("streaks", badgeLevel);

    if (!threshold || !levelLabel) continue;

    badges.push({
      badgeSlug: content.slug,
      badgeLevel: badgeLevel,
      title: levelLabel,
      description: formatBadgeDescription(content.slug, badgeLevel, levelLabel),
      state: "locked" as const,
      progressLabel: formatProgressLabel(
        "locked",
        content.slug,
        currentStreakDays,
        threshold,
        uom,
      ),
      progressPct: 0,
      levelArtwork: getBadgeLevelArtwork("streaks", badgeLevel),
      categoryName: content.title,
    });
  }

  return badges;
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

  const maxLevel = getBadgeMaxLevel("talent");
  const uom = getBadgeUOM("talent");
  const badges: BadgeState[] = [];

  for (let badgeLevel = 1; badgeLevel <= maxLevel; badgeLevel++) {
    const threshold = getBadgeLevelThreshold("talent", badgeLevel);
    const levelLabel = getBadgeLevelLabel("talent", badgeLevel);

    if (!threshold || !levelLabel) continue;

    const earned = talentBalance >= threshold;
    const progress = earned
      ? 100
      : clampToPct((talentBalance / threshold) * 100);

    badges.push({
      badgeSlug: content.slug,
      badgeLevel: badgeLevel,
      title: levelLabel,
      description: formatBadgeDescription(content.slug, badgeLevel, levelLabel),
      state: earned ? "earned" : "locked",
      progressLabel: formatProgressLabel(
        earned ? "earned" : "locked",
        content.slug,
        talentBalance,
        threshold,
        uom,
      ),
      progressPct: progress,
      levelArtwork: getBadgeLevelArtwork("talent", badgeLevel),
      categoryName: content.title,
    });
  }

  return badges;
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

  const maxLevel = getBadgeMaxLevel("base");
  const uom = getBadgeUOM("base");
  const badges: BadgeState[] = [];

  for (let badgeLevel = 1; badgeLevel <= maxLevel; badgeLevel++) {
    const threshold = getBadgeLevelThreshold("base", badgeLevel);
    const levelLabel = getBadgeLevelLabel("base", badgeLevel);

    if (!threshold || !levelLabel) continue;

    const earned = baseTxCount >= threshold;
    const progress = earned ? 100 : clampToPct((baseTxCount / threshold) * 100);

    badges.push({
      badgeSlug: content.slug,
      badgeLevel: badgeLevel,
      title: levelLabel,
      description: formatBadgeDescription(content.slug, badgeLevel, levelLabel),
      state: earned ? "earned" : "locked",
      progressLabel: formatProgressLabel(
        earned ? "earned" : "locked",
        content.slug,
        baseTxCount,
        threshold,
        uom,
      ),
      progressPct: progress,
      levelArtwork: getBadgeLevelArtwork("base", badgeLevel),
      categoryName: content.title,
    });
  }

  return badges;
}

async function computePlatformReownBadges(
  talentUuid: string,
): Promise<BadgeState[]> {
  const content = getBadgeContent("reown");
  if (!content) return [];

  // Get wallet_connect_airdrop_one data point
  // TODO: Replace with actual data point when available
  const reownTaskCount = await getDataPointsSum(talentUuid, [
    "wallet_connect_airdrop_one",
  ]);

  const maxLevel = getBadgeMaxLevel("reown");
  const uom = getBadgeUOM("reown");
  const badges: BadgeState[] = [];

  for (let badgeLevel = 1; badgeLevel <= maxLevel; badgeLevel++) {
    const threshold = getBadgeLevelThreshold("reown", badgeLevel);
    const levelLabel = getBadgeLevelLabel("reown", badgeLevel);

    if (!threshold || !levelLabel) continue;

    const earned = reownTaskCount >= threshold;
    const progress = earned
      ? 100
      : clampToPct((reownTaskCount / threshold) * 100);

    badges.push({
      badgeSlug: content.slug,
      badgeLevel: badgeLevel,
      title: levelLabel,
      description: formatBadgeDescription(content.slug, badgeLevel, levelLabel),
      state: (earned ? "earned" : "locked") as "earned" | "locked",
      progressLabel: formatProgressLabel(
        earned ? "earned" : "locked",
        content.slug,
        reownTaskCount,
        threshold,
        uom,
      ),
      progressPct: progress,
      levelArtwork: getBadgeLevelArtwork("reown", badgeLevel),
      categoryName: content.title,
    });
  }

  return badges;
}

// Main service functions
async function getBadgesForUserUncached(
  talentUuid: string,
): Promise<BadgesResponse> {
  try {
    const [
      creatorScoreBadges,
      totalEarningsBadges,
      totalFollowersBadges,
      streaksBadges,
      platformTalentBadges,
      platformBaseBadges,
      platformReownBadges,
    ] = await Promise.all([
      computeCreatorScoreBadges(talentUuid),
      computeTotalEarningsBadges(talentUuid),
      computeTotalFollowersBadges(talentUuid),
      computeStreaksBadges(talentUuid),
      computePlatformTalentBadges(talentUuid),
      computePlatformBaseBadges(talentUuid),
      computePlatformReownBadges(talentUuid),
    ]);

    const sections: BadgeSection[] = [
      {
        id: "creator-score",
        title: "Creator Score",
        badges: [...creatorScoreBadges],
      },
      {
        id: "streaks",
        title: "Streaks",
        badges: [...streaksBadges],
      },
      {
        id: "metrics",
        title: "Metrics",
        badges: [...totalEarningsBadges, ...totalFollowersBadges],
      },
      {
        id: "platforms",
        title: "Platforms",
        badges: [
          ...platformTalentBadges,
          ...platformBaseBadges,
          ...platformReownBadges,
        ],
      },
    ];

    // Calculate summary
    const allBadges = sections.flatMap((section) => section.badges);
    const earnedCount = allBadges.filter(
      (badge) => badge.state === "earned",
    ).length;
    const totalCount = allBadges.length;
    const completionPct =
      totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

    return {
      sections,
      summary: {
        earnedCount,
        totalCount,
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
  badgeLevel: number,
): Promise<BadgeDetail | null> {
  try {
    const badgesData = await getBadgesForUser(talentUuid);

    // Find the badge across all sections
    let badge: BadgeState | undefined;
    for (const section of badgesData.sections) {
      badge = section.badges.find(
        (b) => b.badgeSlug === badgeSlug && b.badgeLevel === badgeLevel,
      );
      if (badge) break;
    }

    if (!badge) {
      return null;
    }

    // Count earned levels for level-based badges
    let earnedLevels: number | undefined;
    if (badgeSlug === "creator-score") {
      const trophySection = badgesData.sections.find(
        (s) => s.id === "creator-score",
      );
      if (trophySection) {
        earnedLevels = trophySection.badges.filter(
          (b) => b.badgeSlug === "creator-score" && b.state === "earned",
        ).length;
      }
    }

    return {
      badgeSlug: badge.badgeSlug,
      badgeLevel: badge.badgeLevel,
      title: badge.title,
      state: badge.state,
      progressLabel: badge.progressLabel,
      progressPct: badge.progressPct,
      earnedLevels,
      // TODO: Add peer stats when we have the data
      peersStat: undefined,
    };
  } catch (error) {
    console.error("[getBadgeDetail] Error:", error);
    return null;
  }
}

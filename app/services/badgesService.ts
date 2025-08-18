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
  getBadgeThresholds,
  getBadgeLabels,
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
  slug: string;
  title: string;
  description: string;
  state: "earned" | "locked";
  valueLabel: string;
  progressPct: number;
  artwork: {
    earnedUrl: string;
    lockedUrl: string;
  };
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
  slug: string;
  title: string;
  state: "earned" | "locked";
  valueLabel: string;
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

/** Format numbers for display with k/M suffixes (e.g., 1500 → "1.5k", 2000000 → "2.0M") */
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/** Clamp a percentage value to the valid range 0-100 */
function clampToPct(x: number): number {
  return Math.max(0, Math.min(100, x));
}

function formatValueLabel(
  state: "earned" | "locked",
  current: number,
  threshold?: number,
  uom?: string,
): string {
  if (state === "earned") {
    return "Earned";
  }

  if (!threshold) {
    return "Locked";
  }

  const formattedCurrent = formatNumber(current);
  const formattedThreshold = formatNumber(threshold);

  if (uom) {
    return `${formattedCurrent} of ${formattedThreshold} ${uom}`;
  }

  return `${formattedCurrent} of ${formattedThreshold}`;
}

function getArtworkUrls(
  badgeSlug: string,
  levelSlug: string,
): { earnedUrl: string; lockedUrl: string } {
  const basePath = `/images/badges/${badgeSlug}`;
  return {
    earnedUrl: `${basePath}/${badgeSlug}-${levelSlug}-earned.png`,
    lockedUrl: `${basePath}/${badgeSlug}-${levelSlug}-locked.png`,
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
    const level = index + 1;
    const earned = score >= range.min;
    const progress = earned ? 100 : clampToPct((score / range.min) * 100);
    const levelSlug = `creator-score-level-${level}`;

    return {
      slug: levelSlug,
      title: content.labels[index],
      description: formatBadgeDescription(content.slug, level),
      state: earned ? "earned" : "locked",
      valueLabel: earned ? "Earned" : `${score} of ${range.min}`,
      progressPct: progress,
      artwork: getArtworkUrls("creator-score", level.toString()),
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

  const thresholds = getBadgeThresholds("total-earnings");
  const labels = getBadgeLabels("total-earnings");
  const uom = getBadgeUOM("total-earnings");

  return thresholds.map((threshold, index) => {
    const earned = totalEarnings >= threshold;
    const progress = earned
      ? 100
      : clampToPct((totalEarnings / threshold) * 100);
    const levelSlug = `total-earnings-${labels[index].replace("$", "").toLowerCase()}`;

    return {
      slug: levelSlug,
      title: content.labels[index],
      description: formatBadgeDescription(
        content.slug,
        index + 1,
        labels[index],
      ),
      state: earned ? "earned" : "locked",
      valueLabel: formatValueLabel(
        earned ? "earned" : "locked",
        totalEarnings,
        threshold,
        uom,
      ),
      progressPct: progress,
      artwork: getArtworkUrls("total-earnings", (index + 1).toString()),
    };
  });
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

  const thresholds = getBadgeThresholds("total-followers");
  const labels = getBadgeLabels("total-followers");
  const uom = getBadgeUOM("total-followers");

  return thresholds.map((threshold, index) => {
    const earned = totalFollowers >= threshold;
    const progress = earned
      ? 100
      : clampToPct((totalFollowers / threshold) * 100);
    const levelSlug = `total-followers-${labels[index].toLowerCase()}`;

    return {
      slug: levelSlug,
      title: content.labels[index],
      description: formatBadgeDescription(
        content.slug,
        index + 1,
        labels[index],
      ),
      state: earned ? "earned" : "locked",
      valueLabel: formatValueLabel(
        earned ? "earned" : "locked",
        totalFollowers,
        threshold,
        uom,
      ),
      progressPct: progress,
      artwork: getArtworkUrls("total-followers", (index + 1).toString()),
    };
  });
}

async function computeStreaksBadges(
  _talentUuid: string, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<BadgeState[]> {
  // TODO: Implement streaks logic when we have the data source
  // For now, return empty array until we can compute actual streak data
  const content = getBadgeContent("streaks");

  if (!content) return [];

  const thresholds = getBadgeThresholds("streaks");
  const labels = getBadgeLabels("streaks");
  const uom = getBadgeUOM("streaks");

  // Placeholder: all badges locked until we implement streak calculation
  return thresholds.map((threshold, index) => {
    const levelSlug = `streaks-${threshold}`;

    return {
      slug: levelSlug,
      title: content.labels[index],
      description: formatBadgeDescription(
        content.slug,
        index + 1,
        labels[index],
      ),
      state: "locked" as const,
      valueLabel: formatValueLabel("locked", 0, threshold, uom),
      progressPct: 0,
      artwork: getArtworkUrls("streaks", (index + 1).toString()),
    };
  });
}

async function computePlatformTalentBadges(
  talentUuid: string,
): Promise<BadgeState[]> {
  const content = getBadgeContent("platform-talent");
  if (!content) return [];

  // Use existing token balance service for $TALENT balance
  if (!process.env.TALENT_API_KEY) {
    return [];
  }

  const getCachedBalance = getCachedUserTokenBalance(talentUuid);
  const talentBalance = await getCachedBalance(process.env.TALENT_API_KEY);

  const thresholds = getBadgeThresholds("platform-talent");
  const labels = getBadgeLabels("platform-talent");
  const uom = getBadgeUOM("platform-talent");

  return thresholds.map((threshold, index) => {
    const earned = talentBalance >= threshold;
    const progress = earned
      ? 100
      : clampToPct((talentBalance / threshold) * 100);
    const levelSlug = `platform-talent-${labels[index].toLowerCase()}`;

    return {
      slug: levelSlug,
      title: content.labels[index],
      description: formatBadgeDescription(
        content.slug,
        index + 1,
        labels[index],
      ),
      state: earned ? "earned" : "locked",
      valueLabel: formatValueLabel(
        earned ? "earned" : "locked",
        talentBalance,
        threshold,
        uom,
      ),
      progressPct: progress,
      artwork: getArtworkUrls("talent", (index + 1).toString()),
    };
  });
}

async function computePlatformBaseBadges(
  talentUuid: string,
): Promise<BadgeState[]> {
  const content = getBadgeContent("platform-base");
  if (!content) return [];

  // Use generic data points service to get base_out_transactions sum
  const baseTxCount = await getDataPointsSum(talentUuid, [
    "base_out_transactions",
  ]);

  const thresholds = getBadgeThresholds("platform-base");
  const labels = getBadgeLabels("platform-base");
  const uom = getBadgeUOM("platform-base");

  return thresholds.map((threshold, index) => {
    const earned = baseTxCount >= threshold;
    const progress = earned ? 100 : clampToPct((baseTxCount / threshold) * 100);
    const levelSlug = `platform-base-${labels[index].toLowerCase()}`;

    return {
      slug: levelSlug,
      title: content.labels[index],
      description: formatBadgeDescription(
        content.slug,
        index + 1,
        labels[index],
      ),
      state: earned ? "earned" : "locked",
      valueLabel: formatValueLabel(
        earned ? "earned" : "locked",
        baseTxCount,
        threshold,
        uom,
      ),
      progressPct: progress,
      artwork: getArtworkUrls("base", (index + 1).toString()),
    };
  });
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
    ] = await Promise.all([
      computeCreatorScoreBadges(talentUuid),
      computeTotalEarningsBadges(talentUuid),
      computeTotalFollowersBadges(talentUuid),
      computeStreaksBadges(talentUuid),
      computePlatformTalentBadges(talentUuid),
      computePlatformBaseBadges(talentUuid),
    ]);

    const sections: BadgeSection[] = [
      {
        id: "trophies",
        title: "Trophies",
        badges: [...creatorScoreBadges, ...streaksBadges],
      },
      {
        id: "metrics",
        title: "Metrics",
        badges: [...totalEarningsBadges, ...totalFollowersBadges],
      },
      {
        id: "platforms",
        title: "Platforms",
        badges: [...platformTalentBadges, ...platformBaseBadges],
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
): Promise<BadgeDetail | null> {
  try {
    const badgesData = await getBadgesForUser(talentUuid);

    // Find the badge across all sections
    let badge: BadgeState | undefined;
    for (const section of badgesData.sections) {
      badge = section.badges.find((b) => b.slug === badgeSlug);
      if (badge) break;
    }

    if (!badge) {
      return null;
    }

    // Count earned levels for level-based badges
    let earnedLevels: number | undefined;
    if (badgeSlug.startsWith("creator-score-level")) {
      const trophySection = badgesData.sections.find(
        (s) => s.id === "trophies",
      );
      if (trophySection) {
        earnedLevels = trophySection.badges.filter(
          (b) => b.state === "earned",
        ).length;
      }
    }

    return {
      slug: badge.slug,
      title: badge.title,
      state: badge.state,
      valueLabel: badge.valueLabel,
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

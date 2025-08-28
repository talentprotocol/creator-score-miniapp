import { TOTAL_SPONSORS_POOL } from "@/lib/constants";
import type { LeaderboardEntry } from "./types";

export interface RewardsCalculationResult {
  totalPool: number;
  activePool: number;
  futurePool: number;
  totalEligibleScores: number;
  optedOutUsers: number;
  optedOutContribution: number;
  multiplier: number;
}

export interface UserRewardCalculation {
  talentUuid: string;
  name: string;
  baseScore: number;
  boostedScore: number;
  isBoosted: boolean;
  isOptedOut: boolean;
  rank: number;
  baseReward: number;
  finalReward: number;
}

/**
 * Service for calculating rewards with separate pool logic.
 *
 * Rewards Distribution Algorithm:
 * 1. Apply 1.1x boost multiplier to users with 100+ TALENT tokens
 * 2. Separate opted-out users' contributions into a future rewards pool
 * 3. Distribute the active pool only to opted-in creators
 * 4. Future pool accumulates opted-out amounts for later distribution
 *
 * This ensures opted-out money doesn't get redistributed to remaining creators,
 * but instead goes to a separate future pool for later use.
 */
export class RewardsCalculationService {
  /**
   * Calculate rewards for all top 200 users, handling boosts and separate pools
   * @param entries - Top 200 leaderboard entries
   * @returns Array of user reward calculations
   */
  static calculateRewardsWithSeparatePools(
    entries: LeaderboardEntry[],
  ): UserRewardCalculation[] {
    if (entries.length === 0) return [];

    // Step 1: Apply boost calculation to all eligible users (top 200)
    const eligibleEntries = entries.slice(0, 200);

    // Step 2: Calculate boosted scores ONLY for users with 100+ TALENT tokens
    const boostedEntries = eligibleEntries.map((entry) => ({
      ...entry,
      boostedScore: entry.isBoosted ? entry.score * 1.1 : entry.score,
    }));

    // Step 3: Identify opted-out users and separate pools
    const optedOutEntries = boostedEntries.filter((entry) => entry.isOptedOut);
    const activeEntries = boostedEntries.filter((entry) => !entry.isOptedOut);

    // Step 4: Calculate separate pools
    const futurePool = optedOutEntries.reduce(
      (sum, entry) => sum + entry.boostedScore,
      0,
    );

    const activePool = TOTAL_SPONSORS_POOL - futurePool;

    // Step 5: Calculate multiplier for opted-in users only
    const totalActiveBoostedScores = activeEntries.reduce(
      (sum, entry) => sum + entry.boostedScore,
      0,
    );

    const multiplier =
      totalActiveBoostedScores > 0 ? activePool / totalActiveBoostedScores : 0;

    // Step 6: Calculate individual rewards
    return boostedEntries.map((entry, index) => {
      const baseReward = entry.boostedScore * multiplier;

      return {
        talentUuid: String(entry.talent_protocol_id),
        name: entry.name,
        baseScore: entry.score,
        boostedScore: entry.boostedScore,
        isBoosted: entry.isBoosted || false,
        isOptedOut: entry.isOptedOut || false,
        rank: index + 1,
        baseReward,
        finalReward: entry.isOptedOut ? 0 : baseReward,
      };
    });
  }

  /**
   * Get summary of rewards calculation with separate pools
   * @param entries - Top 200 leaderboard entries
   * @returns Rewards calculation summary
   */
  static getRewardsSummary(
    entries: LeaderboardEntry[],
  ): RewardsCalculationResult {
    if (entries.length === 0) {
      return {
        totalPool: TOTAL_SPONSORS_POOL,
        activePool: TOTAL_SPONSORS_POOL,
        futurePool: 0,
        totalEligibleScores: 0,
        optedOutUsers: 0,
        optedOutContribution: 0,
        multiplier: 0,
      };
    }

    const eligibleEntries = entries.slice(0, 200);
    const optedOutUsers = eligibleEntries.filter(
      (entry) => entry.isOptedOut,
    ).length;

    // Calculate total boosted scores for opted-out users (future pool)
    const optedOutContribution = eligibleEntries
      .filter((entry) => entry.isOptedOut)
      .reduce(
        (sum, entry) =>
          sum + (entry.isBoosted ? entry.score * 1.1 : entry.score),
        0,
      );

    // Calculate active pool (for opted-in users)
    const activePool = TOTAL_SPONSORS_POOL - optedOutContribution;

    // Calculate total boosted scores for opted-in users
    const totalEligibleScores = eligibleEntries
      .filter((entry) => !entry.isOptedOut)
      .reduce(
        (sum, entry) =>
          sum + (entry.isBoosted ? entry.score * 1.1 : entry.score),
        0,
      );

    // Calculate multiplier for active pool distribution
    const multiplier =
      totalEligibleScores > 0 ? activePool / totalEligibleScores : 0;

    return {
      totalPool: TOTAL_SPONSORS_POOL,
      activePool,
      futurePool: optedOutContribution,
      totalEligibleScores,
      optedOutUsers,
      optedOutContribution,
      multiplier,
    };
  }

  /**
   * Calculate individual user reward (for display purposes)
   * @param score - User's base score
   * @param rank - User's rank
   * @param isBoosted - Whether user has boost (100+ TALENT tokens)
   * @param isOptedOut - Whether user has opted out
   * @param entries - Top 200 entries for calculation context
   * @returns Formatted reward string
   */
  static calculateUserReward(
    score: number,
    rank: number,
    isBoosted: boolean,
    isOptedOut: boolean,
    entries: LeaderboardEntry[],
  ): string {
    // Only top 200 creators can earn rewards
    if (!rank || rank > 200) return "$0";

    // If opted out, show $0 (money goes to future pool)
    if (isOptedOut) return "$0";

    // Calculate boosted score (only if user has 100+ TALENT tokens)
    const boostedScore = isBoosted ? score * 1.1 : score;

    // Get multiplier from current leaderboard state with separate pools
    const summary = this.getRewardsSummary(entries);
    if (summary.multiplier === 0) return "$0";

    const reward = boostedScore * summary.multiplier;

    // Format as currency
    if (reward >= 1) {
      return `$${reward.toFixed(0)}`;
    } else {
      return `$${reward.toFixed(2)}`;
    }
  }

  /**
   * Get the future pool amount (total contribution from opted-out users)
   * @param entries - Top 200 leaderboard entries
   * @returns Future pool amount
   */
  static getFuturePoolAmount(entries: LeaderboardEntry[]): number {
    if (entries.length === 0) return 0;

    const eligibleEntries = entries.slice(0, 200);

    return eligibleEntries
      .filter((entry) => entry.isOptedOut)
      .reduce(
        (sum, entry) =>
          sum + (entry.isBoosted ? entry.score * 1.1 : entry.score),
        0,
      );
  }

  /**
   * Get the active pool amount (available for opted-in users)
   * @param entries - Top 200 leaderboard entries
   * @returns Active pool amount
   */
  static getActivePoolAmount(entries: LeaderboardEntry[]): number {
    const futurePool = this.getFuturePoolAmount(entries);
    return TOTAL_SPONSORS_POOL - futurePool;
  }
}

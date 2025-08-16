import { TOTAL_SPONSORS_POOL } from "@/lib/constants";
import type { LeaderboardEntry } from "./types";

export interface RewardsCalculationResult {
  totalPool: number;
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
  optedOutContribution: number;
}

/**
 * Service for calculating rewards with opt-out support
 * Follows the algorithm: Boost calculation first, then opt-out handling
 */
export class RewardsCalculationService {
  /**
   * Calculate rewards for all top 200 users, handling boosts and opt-outs
   * @param entries - Top 200 leaderboard entries
   * @returns Array of user reward calculations
   */
  static calculateRewardsWithOptouts(
    entries: LeaderboardEntry[],
  ): UserRewardCalculation[] {
    if (entries.length === 0) return [];

    // Step 1: Apply boost calculation to all eligible users (top 200)
    const eligibleEntries = entries.slice(0, 200);

    // Step 2: Calculate boosted scores for all eligible users
    const boostedEntries = eligibleEntries.map((entry) => ({
      ...entry,
      boostedScore: entry.isBoosted ? entry.score * 1.1 : entry.score,
    }));

    // Step 3: Identify opted-out users
    const optedOutEntries = boostedEntries.filter((entry) => entry.isOptedOut);
    const activeEntries = boostedEntries.filter((entry) => !entry.isOptedOut);

    // Step 4: Calculate total pool and opted-out contribution
    const totalOptedOutContribution = optedOutEntries.reduce(
      (sum, entry) => sum + entry.boostedScore,
      0,
    );

    // Step 5: Calculate multiplier for remaining users
    // Remaining users share the full pool proportionally
    const totalActiveBoostedScores = activeEntries.reduce(
      (sum, entry) => sum + entry.boostedScore,
      0,
    );

    const multiplier =
      totalActiveBoostedScores > 0
        ? TOTAL_SPONSORS_POOL / totalActiveBoostedScores
        : 0;

    // Step 6: Calculate individual rewards
    const results: UserRewardCalculation[] = [];

    // Process opted-out users (they contribute but don't receive)
    optedOutEntries.forEach((entry) => {
      results.push({
        talentUuid: entry.talent_protocol_id.toString(),
        name: entry.name,
        baseScore: entry.score,
        boostedScore: entry.boostedScore,
        isBoosted: entry.isBoosted || false,
        isOptedOut: true,
        rank: entry.rank,
        baseReward: 0,
        finalReward: 0,
        optedOutContribution: entry.boostedScore,
      });
    });

    // Process active users (they receive redistributed rewards)
    activeEntries.forEach((entry) => {
      const baseReward = entry.score * multiplier;
      const finalReward = entry.boostedScore * multiplier;

      results.push({
        talentUuid: entry.talent_protocol_id.toString(),
        name: entry.name,
        baseScore: entry.score,
        boostedScore: entry.boostedScore,
        isBoosted: entry.isBoosted || false,
        isOptedOut: false,
        rank: entry.rank,
        baseReward,
        finalReward,
        optedOutContribution: 0,
      });
    });

    // Sort by rank to maintain order
    results.sort((a, b) => a.rank - b.rank);

    return results;
  }

  /**
   * Get summary statistics for rewards calculation
   * @param entries - Top 200 leaderboard entries
   * @returns Summary of rewards calculation
   */
  static getRewardsSummary(
    entries: LeaderboardEntry[],
  ): RewardsCalculationResult {
    const calculations = this.calculateRewardsWithOptouts(entries);

    const optedOutUsers = calculations.filter((c) => c.isOptedOut).length;
    const optedOutContribution = calculations
      .filter((c) => c.isOptedOut)
      .reduce((sum, c) => sum + c.optedOutContribution, 0);

    const totalEligibleScores = calculations
      .filter((c) => !c.isOptedOut)
      .reduce((sum, c) => sum + c.boostedScore, 0);

    const multiplier =
      totalEligibleScores > 0 ? TOTAL_SPONSORS_POOL / totalEligibleScores : 0;

    return {
      totalPool: TOTAL_SPONSORS_POOL,
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
   * @param isBoosted - Whether user has boost
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

    // If opted out, show $0
    if (isOptedOut) return "$0";

    // Calculate boosted score
    const boostedScore = isBoosted ? score * 1.1 : score;

    // Get multiplier from current leaderboard state
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
}

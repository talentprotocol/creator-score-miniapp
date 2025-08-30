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
 * Service for calculating rewards with opt-out support.
 *
 * Rewards Redistribution Algorithm:
 * 1. Apply 1.1x boost multiplier to users with 100+ TALENT tokens
 * 2. Filter out opted-out users from reward recipients
 * 3. Separate opted-out users' rewards into a separate pool
 * 4. Distribute only the active users' portion among remaining eligible creators
 * 5. Opted-out users contribute their boosted score to the separate pool and receive $0
 *
 * This ensures opted-out rewards go to a separate pool and don't affect other users' rewards.
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

    // Step 2: Calculate boosted scores ONLY for users with 100+ TALENT tokens
    const boostedEntries = eligibleEntries.map((entry) => ({
      ...entry,
      boostedScore: entry.isBoosted ? entry.score * 1.1 : entry.score,
    }));

    // Step 3: Identify opted-out users
    const optedOutEntries = boostedEntries.filter((entry) => entry.isOptedOut);
    const activeEntries = boostedEntries.filter((entry) => !entry.isOptedOut);

    // Step 4: Calculate separate pools
    const totalActiveBoostedScores = activeEntries.reduce(
      (sum, entry) => sum + entry.boostedScore,
      0,
    );

    const totalOptedOutBoostedScores = optedOutEntries.reduce(
      (sum, entry) => sum + entry.boostedScore,
      0,
    );

    // Step 5: Calculate active pool (total pool minus opted-out portion)
    const totalBoostedScores =
      totalActiveBoostedScores + totalOptedOutBoostedScores;
    const activePool =
      totalBoostedScores > 0
        ? (totalActiveBoostedScores / totalBoostedScores) * TOTAL_SPONSORS_POOL
        : 0;

    const multiplier =
      totalActiveBoostedScores > 0 ? activePool / totalActiveBoostedScores : 0;

    // Step 6: Calculate individual rewards
    const results: UserRewardCalculation[] = [];

    // Process opted-out users (they contribute to separate pool but don't receive)
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

    // Process active users (they receive from active pool)
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
   * Calculate and store opted-out users' future pool contributions
   * @param entries - Top 200 leaderboard entries
   * @returns Promise<void>
   */
  static async storeOptedOutContributions(
    entries: LeaderboardEntry[],
  ): Promise<void> {
    const calculations = this.calculateRewardsWithOptouts(entries);

    const totalBoostedScores = calculations.reduce(
      (sum, c) => sum + c.boostedScore,
      0,
    );

    // Calculate contributions for opted-out users
    const optedOutContributions = calculations
      .filter((c) => c.isOptedOut)
      .map((c) => {
        const contribution =
          totalBoostedScores > 0
            ? (c.boostedScore / totalBoostedScores) * TOTAL_SPONSORS_POOL
            : 0;

        return {
          talentUuid: c.talentUuid,
          contribution: contribution,
        };
      });

    // Store in database using existing future_pool_contribution field
    if (optedOutContributions.length > 0) {
      const { supabase } = await import("@/lib/supabase-client");

      const updates = optedOutContributions.map((item) => ({
        talent_uuid: item.talentUuid,
        future_pool_contribution: item.contribution,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("user_preferences")
        .upsert(updates, { onConflict: "talent_uuid" });

      if (error) {
        console.error("Error storing opted-out contributions:", error);
        throw new Error("Failed to store opted-out contributions");
      }
    }
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

    const totalOptedOutScores = calculations
      .filter((c) => c.isOptedOut)
      .reduce((sum, c) => sum + c.boostedScore, 0);

    // Calculate active pool (total pool minus opted-out portion)
    const totalBoostedScores = totalEligibleScores + totalOptedOutScores;
    const activePool = totalBoostedScores > 0 
      ? (totalEligibleScores / totalBoostedScores) * TOTAL_SPONSORS_POOL
      : 0;

    const multiplier = totalEligibleScores > 0 ? activePool / totalEligibleScores : 0;

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

    // If opted out, show $0
    if (isOptedOut) return "$0";

    // Calculate boosted score (only if user has 100+ TALENT tokens)
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

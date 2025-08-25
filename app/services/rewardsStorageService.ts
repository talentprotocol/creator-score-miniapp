import { supabase } from "@/lib/supabase-client";

export interface StoredRewardsData {
  rewards_amount: number | null;
  rewards_calculated_at: string | null;
}

/**
 * Service for managing rewards data storage in the database.
 *
 * This service handles the persistence of calculated rewards amounts
 * for opted-out users, providing fast database-based badge calculations
 * instead of expensive real-time API computations.
 *
 * Architecture:
 * - Stores rewards in existing user_preferences table
 * - Triggered by leaderboard service when data changes
 * - Consumed by badge service for instant lookups
 * - Follows existing patterns from optoutService.ts
 */
export class RewardsStorageService {
  /**
   * Update rewards amount for a user when opted out
   * @param talentUuid - The user's Talent Protocol UUID
   * @param rewardAmount - The calculated reward amount they're donating
   * @returns Promise<void>
   */
  static async updateUserRewards(
    talentUuid: string,
    rewardAmount: number,
  ): Promise<void> {
    try {
      // Validate input
      if (!talentUuid || typeof talentUuid !== "string") {
        throw new Error("Invalid talent_uuid provided");
      }

      if (typeof rewardAmount !== "number" || rewardAmount < 0) {
        throw new Error("Invalid reward amount provided");
      }

      const { error } = await supabase.from("user_preferences").upsert(
        {
          talent_uuid: talentUuid,
          rewards_amount: rewardAmount,
          rewards_calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "talent_uuid" },
      );

      if (error) {
        console.error("Error updating user rewards:", error);
        throw new Error("Failed to update user rewards");
      }
    } catch (error) {
      console.error("Unexpected error in updateUserRewards:", error);
      throw error;
    }
  }

  /**
   * Get stored rewards amount for a user
   * @param talentUuid - The user's Talent Protocol UUID
   * @returns Promise<StoredRewardsData | null>
   */
  static async getStoredRewards(
    talentUuid: string,
  ): Promise<StoredRewardsData | null> {
    try {
      // Validate input
      if (!talentUuid || typeof talentUuid !== "string") {
        return null;
      }

      const { data, error } = await supabase
        .from("user_preferences")
        .select("rewards_amount, rewards_calculated_at")
        .eq("talent_uuid", talentUuid)
        .single();

      if (error) {
        // If no record found, return null (not an error)
        if (error.code === "PGRST116") {
          return null;
        }
        console.error("Error fetching stored rewards:", error);
        return null;
      }

      return {
        rewards_amount: data?.rewards_amount ?? null,
        rewards_calculated_at: data?.rewards_calculated_at ?? null,
      };
    } catch (error) {
      console.error("Unexpected error in getStoredRewards:", error);
      return null;
    }
  }

  /**
   * Batch update rewards for all opted-out users in top 200
   * This is called by the leaderboard service when rewards are recalculated
   * @param rewards - Array of user rewards to store
   * @returns Promise<void>
   */
  static async batchUpdateOptedOutRewards(
    rewards: Array<{ talentUuid: string; amount: number }>,
  ): Promise<void> {
    try {
      if (!Array.isArray(rewards) || rewards.length === 0) {
        return; // Nothing to update
      }

      // Validate all rewards data
      for (const reward of rewards) {
        if (
          !reward.talentUuid ||
          typeof reward.talentUuid !== "string" ||
          typeof reward.amount !== "number" ||
          reward.amount < 0
        ) {
          throw new Error("Invalid reward data in batch update");
        }
      }

      const currentTime = new Date().toISOString();
      const updates = rewards.map((r) => ({
        talent_uuid: r.talentUuid,
        rewards_amount: r.amount,
        rewards_calculated_at: currentTime,
        updated_at: currentTime,
      }));

      const { error } = await supabase
        .from("user_preferences")
        .upsert(updates, { onConflict: "talent_uuid" });

      if (error) {
        console.error("Error in batch rewards update:", error);
        throw new Error("Failed to batch update rewards");
      }

      console.log(
        `[RewardsStorageService] Successfully updated rewards for ${rewards.length} users`,
      );
    } catch (error) {
      console.error("Unexpected error in batchUpdateOptedOutRewards:", error);
      throw error;
    }
  }
}

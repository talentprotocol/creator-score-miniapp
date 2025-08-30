import { supabase } from "@/lib/supabase-client";
import type {
  LeaderboardEntry,
  LeaderboardSnapshot,
} from "@/app/services/types";

export class LeaderboardSnapshotService {
  private static supabase = supabase;

  /**
   * Create a new leaderboard snapshot from current leaderboard data
   * This should be called manually to freeze the leaderboard
   */
  static async createSnapshot(
    entries: LeaderboardEntry[],
  ): Promise<{ success: boolean; snapshotId?: string; error?: string }> {
    try {
      console.log(
        `[LeaderboardSnapshotService] Creating snapshot with ${entries.length} entries`,
      );

      // Delete existing snapshot first (overwrite logic)
      console.log("[LeaderboardSnapshotService] Deleting existing snapshot");
      const { error: deleteError } = await this.supabase
        .from("leaderboard_snapshots")
        .delete()
        .gte("rank", 0);

      if (deleteError) {
        console.error("Error deleting existing snapshot:", deleteError);
        return {
          success: false,
          error: `Failed to delete existing snapshot: ${deleteError.message}`,
        };
      }

      // Import rewards calculation service dynamically to avoid circular dependencies
      const { RewardsCalculationService } = await import(
        "./rewardsCalculationService"
      );

      // Transform leaderboard entries to snapshot format with calculated rewards
      const snapshots = await Promise.all(
        entries.map(async (entry) => {
          const rewardAmount = RewardsCalculationService.calculateUserReward(
            entry.score,
            entry.rank,
            entry.isBoosted || false,
            entry.isOptedOut || false,
            entries,
          );

          // Extract numeric value from formatted string (e.g., "$138" -> 138)
          const numericAmount =
            parseFloat(rewardAmount.replace(/[^0-9.-]/g, "")) || 0;

          return {
            talent_uuid: String(entry.talent_protocol_id),
            rank: entry.rank,
            rewards_amount: numericAmount,
          };
        }),
      );

      // Insert all snapshots in a single transaction
      const { data, error } = await this.supabase
        .from("leaderboard_snapshots")
        .insert(snapshots)
        .select("talent_uuid")
        .limit(1);

      if (error) {
        console.error("Error creating leaderboard snapshot:", error);
        return {
          success: false,
          error: `Failed to create snapshot: ${error.message}`,
        };
      }

      const snapshotId = data?.[0]?.talent_uuid;
      console.log(
        `[LeaderboardSnapshotService] Created leaderboard snapshot with ${snapshots.length} entries`,
      );

      return {
        success: true,
        snapshotId,
      };
    } catch (error) {
      console.error("Unexpected error creating snapshot:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all snapshot data
   */
  static async getSnapshot(): Promise<LeaderboardSnapshot[] | null> {
    try {
      const { data, error } = await this.supabase
        .from("leaderboard_snapshots")
        .select("*")
        .order("rank", { ascending: true });

      if (error) {
        console.error("Error fetching snapshot:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Unexpected error fetching snapshot:", error);
      return null;
    }
  }

  /**
   * Get snapshot data for a specific user
   */
  static async getSnapshotForUser(
    talentUuid: string,
  ): Promise<LeaderboardSnapshot | null> {
    try {
      const { data, error } = await this.supabase
        .from("leaderboard_snapshots")
        .select("*")
        .eq("talent_uuid", talentUuid)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        console.error("Error fetching user snapshot:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Unexpected error fetching user snapshot:", error);
      return null;
    }
  }

  /**
   * Check if a snapshot exists
   */
  static async snapshotExists(): Promise<boolean> {
    try {
      console.log(`[LeaderboardSnapshotService] Checking if snapshot exists`);

      const { count, error } = await this.supabase
        .from("leaderboard_snapshots")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Error checking snapshot existence:", error);
        return false;
      }

      const exists = (count || 0) > 0;
      console.log(
        `[LeaderboardSnapshotService] Snapshot exists: ${exists} (count: ${count})`,
      );

      return exists;
    } catch (error) {
      console.error("Unexpected error checking snapshot existence:", error);
      return false;
    }
  }

  /**
   * Get snapshot metadata (count, creation date, etc.)
   */
  static async getSnapshotMetadata(): Promise<{
    total_count: number;
    created_at: string;
  } | null> {
    try {
      const { data, error } = await this.supabase
        .from("leaderboard_snapshots")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        console.error("Error fetching snapshot metadata:", error);
        return null;
      }

      const { count } = await this.supabase
        .from("leaderboard_snapshots")
        .select("*", { count: "exact", head: true });

      return {
        total_count: count || 0,
        created_at: data[0].created_at,
      };
    } catch (error) {
      console.error("Unexpected error fetching snapshot metadata:", error);
      return null;
    }
  }
}

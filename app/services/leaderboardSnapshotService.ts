import { supabase } from "@/lib/supabase-client";
import type { LeaderboardEntry, LeaderboardSnapshot } from "./types";

export class LeaderboardSnapshotService {
  private static supabase = supabase;

  /**
   * Create a new leaderboard snapshot from current leaderboard data
   * This should be called at ROUND_ENDS_AT to freeze the leaderboard
   */
  static async createSnapshot(
    entries: LeaderboardEntry[],
  ): Promise<{ success: boolean; snapshotId?: string; error?: string }> {
    try {
      console.log(
        `[LeaderboardSnapshotService] Creating snapshot with ${entries.length} entries`,
      );

      // Check if snapshot already exists
      const snapshotExists = await this.snapshotExists();
      if (snapshotExists) {
        console.log(
          `[LeaderboardSnapshotService] Snapshot already exists, aborting`,
        );
        return {
          success: false,
          error: `Snapshot already exists`,
        };
      }

      // Transform leaderboard entries to snapshot format (only essential data)
      const snapshots = entries.map((entry) => ({
        talent_uuid: entry.id,
        rank: entry.rank,
        rewards_amount: entry.boostedReward || entry.baseReward || 0,
      }));

      // Insert all snapshots in a single transaction
      const { data, error } = await this.supabase
        .from("leaderboard_snapshots")
        .insert(snapshots)
        .select("id")
        .limit(1);

      if (error) {
        console.error("Error creating leaderboard snapshot:", error);
        return {
          success: false,
          error: `Failed to create snapshot: ${error.message}`,
        };
      }

      const snapshotId = data?.[0]?.id;
      console.log(
        `Created leaderboard snapshot with ${snapshots.length} entries`,
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

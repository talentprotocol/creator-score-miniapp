import { supabase } from "@/lib/supabase-client";
import type { LeaderboardSnapshot } from "@/lib/types/leaderboard";

export class LeaderboardSnapshotService {
  private static supabase = supabase;

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
      const { count, error } = await this.supabase
        .from("leaderboard_snapshots")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Error checking snapshot existence:", error);
        return false;
      }

      const exists = (count || 0) > 0;

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

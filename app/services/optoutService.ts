import { supabase } from "@/lib/supabase-client";
import { RewardsDecision } from "@/lib/types/user-preferences";

export interface OptoutResponse {
  success: boolean;
  data?: {
    rewards_decision: RewardsDecision;
    decision_made_at: string;
    future_pool_contribution: number;
  };
  error?: string;
}

function emptyCalloutPrefs() {
  return {
    dismissedIds: [],
    permanentlyHiddenIds: [],
  };
}

/**
 * Service for handling rewards opt-out functionality
 */
export class OptoutService {
  /**
   * Opt out of rewards for a user
   * @param talent_uuid - The user's Talent Protocol UUID
   * @returns Promise<OptoutResponse>
   */
  static async optOut(talent_uuid: string): Promise<OptoutResponse> {
    try {
      // Validate input
      if (!talent_uuid || typeof talent_uuid !== "string") {
        return {
          success: false,
          error: "Invalid talent_uuid provided",
        };
      }

      const { data: existingPrefs } = await supabase
        .from("user_preferences")
        .select("rewards_decision, callout_prefs, future_pool_contribution")
        .eq("talent_uuid", talent_uuid)
        .single();

      // Build new callout prefs ensuring 'optout' callout is permanently hidden after opt-out
      // This prevents the opt-out callout from appearing again for users who have already opted out
      type CalloutPrefs = {
        dismissedIds?: string[];
        permanentlyHiddenIds?: string[];
      };
      const currentPrefs: CalloutPrefs =
        (existingPrefs?.callout_prefs as CalloutPrefs | null) ??
        emptyCalloutPrefs();
      const currentDismissed = Array.isArray(currentPrefs.dismissedIds)
        ? currentPrefs.dismissedIds
        : [];
      const currentHidden = Array.isArray(currentPrefs.permanentlyHiddenIds)
        ? currentPrefs.permanentlyHiddenIds
        : [];
      // Add 'optout' to permanently hidden callouts if not already present
      const nextHidden = currentHidden.includes("optout")
        ? currentHidden
        : [...currentHidden, "optout"];
      const nextCalloutPrefs: CalloutPrefs = {
        dismissedIds: currentDismissed,
        permanentlyHiddenIds: nextHidden,
      };

      // If user already opted out, we still ensure callout_prefs is updated
      const { data, error } = await supabase
        .from("user_preferences")
        .upsert(
          {
            talent_uuid,
            rewards_decision: "opted_out" as RewardsDecision,
            callout_prefs: nextCalloutPrefs as unknown as Record<
              string,
              unknown
            >,
            decision_made_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "talent_uuid" },
        )
        .select(
          "rewards_decision, decision_made_at, future_pool_contribution, updated_at",
        )
        .single();

      if (error) {
        console.error("Error updating opt-out preference:", error);
        return {
          success: false,
          error: "Failed to update opt-out preference",
        };
      }

      return {
        success: true,
        data: {
          rewards_decision: data.rewards_decision,
          decision_made_at: data.decision_made_at,
          future_pool_contribution: data.future_pool_contribution,
        },
      };
    } catch (error) {
      console.error("Unexpected error in optOut:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }

  /**
   * Opt in to rewards for a user
   * @param talent_uuid - The user's Talent Protocol UUID
   * @returns Promise<OptoutResponse>
   */
  static async optIn(talent_uuid: string): Promise<OptoutResponse> {
    try {
      // Validate input
      if (!talent_uuid || typeof talent_uuid !== "string") {
        return {
          success: false,
          error: "Invalid talent_uuid provided",
        };
      }

      const { data, error } = await supabase
        .from("user_preferences")
        .upsert(
          {
            talent_uuid,
            rewards_decision: "opted_in" as RewardsDecision,
            decision_made_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "talent_uuid" },
        )
        .select(
          "rewards_decision, decision_made_at, future_pool_contribution, updated_at",
        )
        .single();

      if (error) {
        console.error("Error updating opt-in preference:", error);
        return {
          success: false,
          error: "Failed to update opt-in preference",
        };
      }

      return {
        success: true,
        data: {
          rewards_decision: data.rewards_decision,
          decision_made_at: data.decision_made_at,
          future_pool_contribution: data.future_pool_contribution,
        },
      };
    } catch (error) {
      console.error("Unexpected error in optIn:", error);
      return {
        success: false,
        error: "An unexpected error occurred",
      };
    }
  }

  /**
   * Check if a user has opted out of rewards
   * @param talent_uuid - The user's Talent Protocol UUID
   * @returns Promise<boolean>
   */
  static async isOptedOut(talent_uuid: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("rewards_decision")
        .eq("talent_uuid", talent_uuid)
        .single();

      if (error) {
        console.error("Error checking opt-out status:", error);
        return false;
      }

      return data?.rewards_decision === "opted_out";
    } catch (error) {
      console.error("Unexpected error checking opt-out status:", error);
      return false;
    }
  }

  /**
   * Check if a user has opted in to rewards
   * @param talent_uuid - The user's Talent Protocol UUID
   * @returns Promise<boolean>
   */
  static async isOptedIn(talent_uuid: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("rewards_decision")
        .eq("talent_uuid", talent_uuid)
        .single();

      if (error) {
        console.error("Error checking opt-in status:", error);
        return false;
      }

      return data?.rewards_decision === "opted_in";
    } catch (error) {
      console.error("Unexpected error checking opt-in status:", error);
      return false;
    }
  }

  /**
   * Check if a user has made a rewards decision
   * @param talent_uuid - The user's Talent Protocol UUID
   * @returns Promise<boolean>
   */
  static async hasMadeDecision(talent_uuid: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("rewards_decision")
        .eq("talent_uuid", talent_uuid)
        .single();

      if (error) {
        console.error("Error checking decision status:", error);
        return false;
      }

      return data?.rewards_decision !== null;
    } catch (error) {
      console.error("Unexpected error checking decision status:", error);
      return false;
    }
  }

  /**
   * Get the user's current rewards decision
   * @param talent_uuid - The user's Talent Protocol UUID
   * @returns Promise<RewardsDecision>
   */
  static async getRewardsDecision(
    talent_uuid: string,
  ): Promise<RewardsDecision> {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("rewards_decision")
        .eq("talent_uuid", talent_uuid)
        .single();

      if (error) {
        console.error("Error getting rewards decision:", error);
        return null;
      }

      return data?.rewards_decision ?? null;
    } catch (error) {
      console.error("Unexpected error getting rewards decision:", error);
      return null;
    }
  }

  /**
   * Get all users who have opted out of rewards
   * @returns Promise<string[]> - Array of talent UUIDs
   */
  static async getAllOptedOutUsers(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("talent_uuid")
        .eq("rewards_decision", "opted_out");

      if (error) {
        console.error("Error fetching opted-out users:", error);
        return [];
      }

      return data?.map((row) => row.talent_uuid) ?? [];
    } catch (error) {
      console.error("Unexpected error fetching opted-out users:", error);
      return [];
    }
  }
}

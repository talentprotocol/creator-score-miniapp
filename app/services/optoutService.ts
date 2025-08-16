import { supabase } from "@/lib/supabase-client";

export interface OptoutRequest {
  talent_uuid: string;
  confirm_optout: boolean;
}

export interface OptoutResponse {
  success: boolean;
  data?: {
    rewards_optout: boolean;
    updated_at: string;
  };
  error?: string;
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
        .select("rewards_optout, callout_prefs")
        .eq("talent_uuid", talent_uuid)
        .single();

      // Build new callout prefs ensuring 'optout' is permanently hidden
      type CalloutPrefs = {
        dismissedIds?: string[];
        permanentlyHiddenIds?: string[];
      };
      const currentPrefs: CalloutPrefs =
        (existingPrefs?.callout_prefs as CalloutPrefs | null) ?? {};
      const currentDismissed = Array.isArray(currentPrefs.dismissedIds)
        ? currentPrefs.dismissedIds
        : [];
      const currentHidden = Array.isArray(currentPrefs.permanentlyHiddenIds)
        ? currentPrefs.permanentlyHiddenIds
        : [];
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
            rewards_optout: true,
            callout_prefs: nextCalloutPrefs as unknown as Record<
              string,
              unknown
            >,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "talent_uuid" },
        )
        .select("rewards_optout, updated_at")
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
          rewards_optout: data.rewards_optout,
          updated_at: data.updated_at,
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
   * Check if a user has opted out of rewards
   * @param talent_uuid - The user's Talent Protocol UUID
   * @returns Promise<boolean>
   */
  static async isOptedOut(talent_uuid: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("rewards_optout")
        .eq("talent_uuid", talent_uuid)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking opt-out status:", error);
        return false;
      }

      return data?.rewards_optout === true;
    } catch (error) {
      console.error("Unexpected error checking opt-out status:", error);
      return false;
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
        .eq("rewards_optout", true);

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

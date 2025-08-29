import { CREATOR_CATEGORIES } from "@/lib/credentialUtils";

export type CreatorCategory = keyof typeof CREATOR_CATEGORIES;

export type RewardsDecision = "opted_in" | "opted_out" | null;

export interface UserPreferences {
  talent_uuid: string;
  creator_category: CreatorCategory | null;
  email?: string;
  notification_preferences?: Record<string, unknown>;
  callout_prefs?: {
    dismissedIds?: string[];
    permanentlyHiddenIds?: string[];
  };
  rewards_decision?: RewardsDecision;
  decision_made_at?: string;
  future_pool_contribution?: number;
  primary_wallet_address?: string;
  how_to_earn_modal_seen?: boolean;
  rewards_amount?: number;
  rewards_calculated_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferencesResponse {
  creator_category: CreatorCategory | null;
  callout_prefs: {
    dismissedIds: string[];
    permanentlyHiddenIds: string[];
  };
  rewards_decision: RewardsDecision;
  future_pool_contribution: number;
  primary_wallet_address?: string;
  how_to_earn_modal_seen: boolean;
  updated_at?: string;
}

export interface UserPreferencesUpdateRequest {
  talent_uuid: string;
  creator_category: CreatorCategory | null;
  // Atomic ops for callout preferences (all optional)
  add_dismissed_id?: string;
  add_permanently_hidden_id?: string;
  remove_dismissed_id?: string;
  remove_permanently_hidden_id?: string;
  // Rewards decision preference
  rewards_decision?: RewardsDecision;
  // Primary wallet address for rewards
  primary_wallet_address?: string;
  // How to earn modal seen preference
  how_to_earn_modal_seen?: boolean;
}

export interface UserPreferencesError {
  error: string;
  details?: string;
}

export interface UserPreferencesSuccess {
  success: true;
  data?: Record<string, unknown>;
}

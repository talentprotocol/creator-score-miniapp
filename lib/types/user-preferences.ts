export type RewardsDecision = "opted_in" | "opted_out" | null;

export interface UserPreferences {
  talent_uuid: string;
  email?: string;
  notification_preferences?: Record<string, unknown>;
  callout_prefs?: {
    dismissedIds?: string[];
    permanentlyHiddenIds?: string[];
  };
  rewards_decision?: RewardsDecision;
  decision_made_at?: string;
  future_pool_contribution?: number;
  rewards_calculated_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferencesResponse {
  callout_prefs: {
    dismissedIds: string[];
    permanentlyHiddenIds: string[];
  };
  rewards_decision: RewardsDecision;
  future_pool_contribution: number;
}

export interface UserPreferencesUpdateRequest {
  talent_uuid: string;
  // Atomic ops for callout preferences (all optional)
  add_dismissed_id?: string;
  add_permanently_hidden_id?: string;
  remove_dismissed_id?: string;
  remove_permanently_hidden_id?: string;
  // Rewards decision preference
  rewards_decision?: RewardsDecision;
}

export interface UserPreferencesError {
  error: string;
  details?: string;
}

export interface UserPreferencesSuccess {
  success: true;
  data?: Record<string, unknown>;
}

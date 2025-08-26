import { CREATOR_CATEGORIES } from "../credentialUtils";

export type CreatorCategory = keyof typeof CREATOR_CATEGORIES;

export interface UserPreferences {
  talent_uuid: string;
  creator_category: CreatorCategory | null;
  email?: string;
  notification_preferences?: Record<string, unknown>;
  callout_prefs?: {
    dismissedIds?: string[];
    permanentlyHiddenIds?: string[];
  };
  rewards_optout?: boolean;
  how_to_earn_modal_seen?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferencesResponse {
  creator_category: CreatorCategory | null;
  callout_prefs: {
    dismissedIds: string[];
    permanentlyHiddenIds: string[];
  };
  rewards_optout: boolean;
  how_to_earn_modal_seen: boolean;
}

export interface UserPreferencesUpdateRequest {
  talent_uuid: string;
  creator_category: CreatorCategory | null;
  // Atomic ops for callout preferences (all optional)
  add_dismissed_id?: string;
  add_permanently_hidden_id?: string;
  remove_dismissed_id?: string;
  remove_permanently_hidden_id?: string;
  // Rewards opt-out preference
  rewards_optout?: boolean;
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

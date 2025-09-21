import { CREATOR_CATEGORIES } from "@/lib/credentialUtils";

export type CreatorCategory = keyof typeof CREATOR_CATEGORIES;

export interface UserPreferences {
  talent_uuid: string;
  creator_category: CreatorCategory | null;
  email?: string;
  notification_preferences?: Record<string, unknown>;
  callout_prefs?: {
    permanentlyHiddenIds?: string[];
  };
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferencesResponse {
  creator_category: CreatorCategory | null;
  callout_prefs: {
    permanentlyHiddenIds: string[];
  };
  updated_at?: string;
}

export interface UserPreferencesUpdateRequest {
  talent_uuid: string;
  creator_category?: CreatorCategory | null;
  // Atomic ops for callout preferences (all optional)
  add_permanently_hidden_id?: string;
  remove_permanently_hidden_id?: string;
}

export interface UserPreferencesError {
  error: string;
  details?: string;
}

export interface UserPreferencesSuccess {
  success: true;
  data?: Record<string, unknown>;
}

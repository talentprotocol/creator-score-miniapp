import { CREATOR_CATEGORIES } from "../credentialUtils";

export type CreatorCategory = keyof typeof CREATOR_CATEGORIES;

export interface UserPreferences {
  talent_uuid: string;
  creator_category: CreatorCategory | null;
  email?: string;
  notification_preferences?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferencesResponse {
  creator_category: CreatorCategory | null;
}

export interface UserPreferencesUpdateRequest {
  talent_uuid: string;
  creator_category: CreatorCategory | null;
}

export interface UserPreferencesError {
  error: string;
  details?: string;
}

export interface UserPreferencesSuccess {
  success: true;
  data?: Record<string, unknown>;
}

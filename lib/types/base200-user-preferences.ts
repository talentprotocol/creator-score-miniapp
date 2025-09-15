export interface Base200UserPreferences {
  talent_uuid: string;
  callout_prefs: {
    dismissedIds: string[];
    permanentlyHiddenIds: string[];
  };
  created_at?: string;
  updated_at?: string;
}

export interface Base200UserPreferencesResponse {
  callout_prefs: {
    dismissedIds: string[];
    permanentlyHiddenIds: string[];
  };
}

export interface Base200UserPreferencesUpdateRequest {
  talent_uuid: string;
  // Atomic ops for callout preferences (all optional)
  add_dismissed_id?: string;
  add_permanently_hidden_id?: string;
  remove_dismissed_id?: string;
  remove_permanently_hidden_id?: string;
}

export interface Base200UserPreferencesError {
  error: string;
  details?: string;
}

export interface Base200UserPreferencesSuccess {
  success: true;
  data?: Record<string, unknown>;
}

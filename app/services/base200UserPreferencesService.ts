import { supabase } from "@/lib/supabase-client";
import {
  Base200UserPreferencesResponse,
  Base200UserPreferencesUpdateRequest,
} from "@/lib/types/base200-user-preferences";

function emptyCalloutPrefs() {
  return {
    dismissedIds: [],
    permanentlyHiddenIds: [],
  };
}

export async function getBase200UserPreferencesByTalentUuid(
  talentUUID: string,
): Promise<Base200UserPreferencesResponse> {
  const { data, error } = await supabase
    .from("base200_user_preferences")
    .select("callout_prefs")
    .eq("talent_uuid", talentUUID)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  const callout_prefs =
    (data?.callout_prefs as {
      dismissedIds?: string[];
      permanentlyHiddenIds?: string[];
    } | null) ?? emptyCalloutPrefs();

  return {
    callout_prefs: {
      dismissedIds: callout_prefs.dismissedIds ?? [],
      permanentlyHiddenIds: callout_prefs.permanentlyHiddenIds ?? [],
    },
  };
}

export async function updateBase200UserPreferencesAtomic(
  req: Base200UserPreferencesUpdateRequest,
) {
  const { talent_uuid } = req;

  // Fetch or initialize
  const current = await getBase200UserPreferencesByTalentUuid(talent_uuid);

  const next = {
    callout_prefs: {
      dismissedIds: new Set(current.callout_prefs.dismissedIds),
      permanentlyHiddenIds: new Set(current.callout_prefs.permanentlyHiddenIds),
    },
  } as {
    callout_prefs: {
      dismissedIds: Set<string>;
      permanentlyHiddenIds: Set<string>;
    };
  };

  if (req.add_dismissed_id)
    next.callout_prefs.dismissedIds.add(req.add_dismissed_id);
  if (req.add_permanently_hidden_id)
    next.callout_prefs.permanentlyHiddenIds.add(req.add_permanently_hidden_id);
  if (req.remove_dismissed_id)
    next.callout_prefs.dismissedIds.delete(req.remove_dismissed_id);
  if (req.remove_permanently_hidden_id)
    next.callout_prefs.permanentlyHiddenIds.delete(
      req.remove_permanently_hidden_id,
    );

  const payload = {
    talent_uuid,
    callout_prefs: {
      dismissedIds: Array.from(next.callout_prefs.dismissedIds),
      permanentlyHiddenIds: Array.from(next.callout_prefs.permanentlyHiddenIds),
    },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("base200_user_preferences")
    .upsert(payload, { onConflict: "talent_uuid" })
    .select("callout_prefs, updated_at")
    .single();

  if (error) throw error;

  return {
    callout_prefs: {
      dismissedIds:
        (
          data.callout_prefs as {
            dismissedIds?: string[];
            permanentlyHiddenIds?: string[];
          }
        ).dismissedIds ?? [],
      permanentlyHiddenIds:
        (
          data.callout_prefs as {
            dismissedIds?: string[];
            permanentlyHiddenIds?: string[];
          }
        ).permanentlyHiddenIds ?? [],
    },
    updated_at: data.updated_at,
  };
}

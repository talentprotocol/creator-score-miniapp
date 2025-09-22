import { supabase } from "@/lib/supabase-client";
import {
  UserPreferencesResponse,
  UserPreferencesUpdateRequest,
} from "@/lib/types/user-preferences";

function emptyCalloutPrefs() {
  return {
    permanentlyHiddenIds: [],
  };
}

export async function getUserPreferencesByTalentUuid(
  talentUUID: string,
): Promise<UserPreferencesResponse> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("creator_category, callout_prefs, updated_at")
    .eq("talent_uuid", talentUUID)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  const callout_prefs =
    (data?.callout_prefs as {
      permanentlyHiddenIds?: string[];
    } | null) ?? emptyCalloutPrefs();

  return {
    creator_category:
      (data?.creator_category as UserPreferencesResponse["creator_category"]) ??
      null,
    callout_prefs: {
      permanentlyHiddenIds: callout_prefs.permanentlyHiddenIds ?? [],
    },
    updated_at: data?.updated_at ?? undefined,
  };
}

export async function updateUserPreferencesAtomic(
  req: UserPreferencesUpdateRequest,
) {
  const { talent_uuid } = req;

  // Fetch or initialize
  const current = await getUserPreferencesByTalentUuid(talent_uuid);

  const next = {
    creator_category: req.creator_category ?? current.creator_category ?? null,
    callout_prefs: {
      permanentlyHiddenIds: new Set(current.callout_prefs.permanentlyHiddenIds),
    },
  } as {
    creator_category: UserPreferencesResponse["creator_category"];
    callout_prefs: {
      permanentlyHiddenIds: Set<string>;
    };
  };

  if (req.add_permanently_hidden_id)
    next.callout_prefs.permanentlyHiddenIds.add(req.add_permanently_hidden_id);
  if (req.remove_permanently_hidden_id)
    next.callout_prefs.permanentlyHiddenIds.delete(
      req.remove_permanently_hidden_id,
    );

  const payload = {
    talent_uuid,
    creator_category: next.creator_category,
    callout_prefs: {
      permanentlyHiddenIds: Array.from(next.callout_prefs.permanentlyHiddenIds),
    },
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(payload, { onConflict: "talent_uuid" })
    .select("creator_category, callout_prefs, updated_at")
    .single();

  if (error) throw error;

  return {
    creator_category: data.creator_category,
    callout_prefs: {
      permanentlyHiddenIds:
        (
          data.callout_prefs as {
            permanentlyHiddenIds?: string[];
          }
        ).permanentlyHiddenIds ?? [],
    },
    updated_at: data.updated_at,
  };
}

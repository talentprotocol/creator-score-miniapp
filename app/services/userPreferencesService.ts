import { supabase } from "@/lib/supabase-client";
import type {
  UserPreferences,
  UserPreferencesResponse,
  UserPreferencesUpdateRequest,
} from "@/lib/types/user-preferences";

function emptyCalloutPrefs() {
  return { dismissedIds: [] as string[], permanentlyHiddenIds: [] as string[] };
}

export async function getUserPreferencesByTalentUuid(
  talentUUID: string,
): Promise<UserPreferencesResponse> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("creator_category, callout_prefs")
    .eq("talent_uuid", talentUUID)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  const callout_prefs =
    (data?.callout_prefs as {
      dismissedIds?: string[];
      permanentlyHiddenIds?: string[];
    } | null) ?? emptyCalloutPrefs();

  return {
    creator_category:
      (data?.creator_category as UserPreferences["creator_category"]) ?? null,
    callout_prefs: {
      dismissedIds: callout_prefs.dismissedIds ?? [],
      permanentlyHiddenIds: callout_prefs.permanentlyHiddenIds ?? [],
    },
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
      dismissedIds: new Set(current.callout_prefs.dismissedIds),
      permanentlyHiddenIds: new Set(current.callout_prefs.permanentlyHiddenIds),
    },
  } as {
    creator_category: UserPreferences["creator_category"];
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
    creator_category: next.creator_category,
    callout_prefs: {
      dismissedIds: Array.from(next.callout_prefs.dismissedIds),
      permanentlyHiddenIds: Array.from(next.callout_prefs.permanentlyHiddenIds),
    },
    updated_at: new Date().toISOString(),
  } satisfies Partial<UserPreferences> & { talent_uuid: string };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(payload, { onConflict: "talent_uuid" })
    .select("creator_category, callout_prefs")
    .single();

  if (error) throw error;

  return {
    success: true as const,
    data,
  };
}

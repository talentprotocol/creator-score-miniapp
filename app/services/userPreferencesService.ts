import { supabase } from "@/lib/supabase-client";
import {
  UserPreferencesResponse,
  UserPreferencesUpdateRequest,
} from "@/lib/types/user-preferences";

function emptyCalloutPrefs() {
  return {
    dismissedIds: [],
    permanentlyHiddenIds: [],
  };
}

export async function getUserPreferencesByTalentUuid(
  talentUUID: string,
): Promise<UserPreferencesResponse> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select(
      "creator_category, callout_prefs, rewards_decision, future_pool_contribution, primary_wallet_address, how_to_earn_modal_seen",
    )
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
      (data?.creator_category as UserPreferencesResponse["creator_category"]) ??
      null,
    callout_prefs: {
      dismissedIds: callout_prefs.dismissedIds ?? [],
      permanentlyHiddenIds: callout_prefs.permanentlyHiddenIds ?? [],
    },
    rewards_decision:
      (data?.rewards_decision as UserPreferencesResponse["rewards_decision"]) ??
      null,
    future_pool_contribution: (data?.future_pool_contribution as number) ?? 0,
    primary_wallet_address: data?.primary_wallet_address ?? undefined,
    how_to_earn_modal_seen: (data?.how_to_earn_modal_seen as boolean) ?? false,
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
    rewards_decision: req.rewards_decision ?? current.rewards_decision ?? null,
    primary_wallet_address:
      req.primary_wallet_address ?? current.primary_wallet_address ?? undefined,
    how_to_earn_modal_seen:
      req.how_to_earn_modal_seen ?? current.how_to_earn_modal_seen ?? false,
  } as {
    creator_category: UserPreferencesResponse["creator_category"];
    callout_prefs: {
      dismissedIds: Set<string>;
      permanentlyHiddenIds: Set<string>;
    };
    rewards_decision: UserPreferencesResponse["rewards_decision"];
    primary_wallet_address?: string;
    how_to_earn_modal_seen: boolean;
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
    rewards_decision: next.rewards_decision,
    primary_wallet_address: next.primary_wallet_address,
    how_to_earn_modal_seen: next.how_to_earn_modal_seen,
    updated_at: new Date().toISOString(),
    decision_made_at: undefined as string | undefined,
  };

  // Add decision_made_at timestamp when rewards_decision changes to a non-NULL value
  if (
    req.rewards_decision !== undefined &&
    req.rewards_decision !== current.rewards_decision &&
    req.rewards_decision !== null
  ) {
    payload.decision_made_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(payload, { onConflict: "talent_uuid" })
    .select(
      "creator_category, callout_prefs, rewards_decision, future_pool_contribution, primary_wallet_address, how_to_earn_modal_seen, updated_at, decision_made_at",
    )
    .single();

  if (error) throw error;

  // No cache invalidation needed since user preferences are no longer cached
  if (
    req.rewards_decision !== undefined &&
    req.rewards_decision !== current.rewards_decision
  ) {
    console.log(
      `[UserPreferencesService] Rewards decision updated for user ${talent_uuid}: ${current.rewards_decision} -> ${req.rewards_decision}`,
    );
  }

  return {
    creator_category: data.creator_category,
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
    rewards_decision: data.rewards_decision,
    future_pool_contribution: data.future_pool_contribution,
    primary_wallet_address: data.primary_wallet_address,
    how_to_earn_modal_seen: data.how_to_earn_modal_seen,
    updated_at: data.updated_at,
    decision_made_at: data.decision_made_at,
  };
}

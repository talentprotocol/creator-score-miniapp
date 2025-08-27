import { supabase } from "@/lib/supabase-client";
import { PERK_DRAW_DEADLINE_UTC } from "@/lib/constants";
import { getLevelFromScore } from "@/lib/utils";
import { getCreatorScoreForTalentId } from "./scoresService";

// NOTE: Perk system is currently disabled/inaccessible
// This service remains functional for future perk implementations

export type PerkEntryStatus = "ineligible" | "open" | "entered" | "closed";

export async function getPerkEntryStatus(params: {
  perkSlug: string;
  talentUUID: string;
  nowUtc?: Date;
}): Promise<{
  status: PerkEntryStatus;
  enteredAt?: string | null;
  deadlineIso: string;
}> {
  const { perkSlug, talentUUID } = params;
  const nowUtc = params.nowUtc ?? new Date();

  // Check deadline first: after deadline everyone is closed
  if (nowUtc.getTime() > PERK_DRAW_DEADLINE_UTC.getTime()) {
    return {
      status: "closed",
      deadlineIso: PERK_DRAW_DEADLINE_UTC.toISOString(),
    };
  }

  // Check if already entered
  const { data: existing } = await supabase
    .from("perk_entries")
    .select("entered_at")
    .eq("perk_slug", perkSlug)
    .eq("talent_uuid", talentUUID)
    .maybeSingle();
  if (existing?.entered_at) {
    return {
      status: "entered",
      enteredAt: existing.entered_at,
      deadlineIso: PERK_DRAW_DEADLINE_UTC.toISOString(),
    };
  }

  // Not entered, check eligibility (level >= 3)
  const score = await getCreatorScoreForTalentId(talentUUID)();
  const level = getLevelFromScore(score.score ?? 0);
  if (level < 3) {
    return {
      status: "ineligible",
      deadlineIso: PERK_DRAW_DEADLINE_UTC.toISOString(),
    };
  }

  return { status: "open", deadlineIso: PERK_DRAW_DEADLINE_UTC.toISOString() };
}

export async function enterPerkDraw(params: {
  perkSlug: string;
  talentUUID: string;
  nowUtc?: Date;
}): Promise<{
  status: PerkEntryStatus;
  enteredAt?: string | null;
  deadlineIso: string;
}> {
  const { perkSlug, talentUUID } = params;
  const nowUtc = params.nowUtc ?? new Date();

  // Deadline enforcement
  if (nowUtc.getTime() > PERK_DRAW_DEADLINE_UTC.getTime()) {
    return {
      status: "closed",
      deadlineIso: PERK_DRAW_DEADLINE_UTC.toISOString(),
    };
  }

  // Eligibility
  const score = await getCreatorScoreForTalentId(talentUUID)();
  const level = getLevelFromScore(score.score ?? 0);
  if (level < 3) {
    return {
      status: "ineligible",
      deadlineIso: PERK_DRAW_DEADLINE_UTC.toISOString(),
    };
  }

  // Idempotent insert
  const { data: existing } = await supabase
    .from("perk_entries")
    .select("entered_at")
    .eq("perk_slug", perkSlug)
    .eq("talent_uuid", talentUUID)
    .maybeSingle();

  if (existing?.entered_at) {
    return {
      status: "entered",
      enteredAt: existing.entered_at,
      deadlineIso: PERK_DRAW_DEADLINE_UTC.toISOString(),
    };
  }

  const { data, error } = await supabase
    .from("perk_entries")
    .insert({ perk_slug: perkSlug, talent_uuid: talentUUID, status: "applied" })
    .select("entered_at")
    .single();

  if (error) {
    // If unique violation, treat as entered
    if ((error as { code?: string } | null)?.code === "23505") {
      const { data: again } = await supabase
        .from("perk_entries")
        .select("entered_at")
        .eq("perk_slug", perkSlug)
        .eq("talent_uuid", talentUUID)
        .maybeSingle();
      return {
        status: "entered",
        enteredAt: again?.entered_at ?? null,
        deadlineIso: PERK_DRAW_DEADLINE_UTC.toISOString(),
      };
    }
    throw error;
  }

  return {
    status: "entered",
    enteredAt: data?.entered_at ?? null,
    deadlineIso: PERK_DRAW_DEADLINE_UTC.toISOString(),
  };
}

import { NextRequest, NextResponse } from "next/server";
import {
  getUserPreferencesByTalentUuid,
  updateUserPreferencesAtomic,
} from "@/app/services/userPreferencesService";
import { validateTalentUUID } from "@/lib/validation";
import type {
  UserPreferencesResponse,
  UserPreferencesUpdateRequest,
  UserPreferencesError,
} from "@/lib/types/user-preferences";

export async function GET(
  req: NextRequest,
): Promise<NextResponse<UserPreferencesResponse | UserPreferencesError>> {
  const { searchParams } = req.nextUrl;
  const talentUUID = searchParams.get("talent_uuid");

  if (!talentUUID) {
    return NextResponse.json(
      { error: "Missing talent_uuid parameter" },
      { status: 400 },
    );
  }

  if (!validateTalentUUID(talentUUID)) {
    return NextResponse.json(
      { error: "Invalid talent_uuid format" },
      { status: 400 },
    );
  }

  try {
    const prefs = await getUserPreferencesByTalentUuid(talentUUID);
    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<UserPreferencesResponse | UserPreferencesError>> {
  try {
    const {
      talent_uuid,
      add_dismissed_id,
      add_permanently_hidden_id,
      remove_dismissed_id,
      remove_permanently_hidden_id,
      rewards_decision,
    }: UserPreferencesUpdateRequest = await req.json();

    if (!talent_uuid) {
      return NextResponse.json(
        { error: "Missing talent_uuid" },
        { status: 400 },
      );
    }

    if (!validateTalentUUID(talent_uuid)) {
      return NextResponse.json(
        { error: "Invalid talent_uuid format" },
        { status: 400 },
      );
    }

    // Validate rewards_decision field
    if (rewards_decision !== undefined && rewards_decision !== null) {
      if (rewards_decision !== "opted_in" && rewards_decision !== "opted_out") {
        return NextResponse.json(
          {
            error: `Invalid rewards_decision value: ${rewards_decision}. Must be "opted_in", "opted_out", or null`,
          },
          { status: 400 },
        );
      }
    }

    const result = await updateUserPreferencesAtomic({
      talent_uuid,
      add_dismissed_id,
      add_permanently_hidden_id,
      remove_dismissed_id,
      remove_permanently_hidden_id,
      rewards_decision,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}

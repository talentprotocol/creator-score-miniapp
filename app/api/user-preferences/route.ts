import { NextRequest, NextResponse } from "next/server";
import {
  getUserPreferencesByTalentUuid,
  updateUserPreferencesAtomic,
} from "@/app/services/userPreferencesService";
import {
  validateCreatorCategory,
  validateTalentUUID,
  getCreatorCategoryErrorMessage,
} from "@/lib/validation";
import type {
  UserPreferencesResponse,
  UserPreferencesUpdateRequest,
  UserPreferencesError,
  UserPreferencesSuccess,
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
): Promise<NextResponse<UserPreferencesSuccess | UserPreferencesError>> {
  try {
    const {
      talent_uuid,
      creator_category,
      add_dismissed_id,
      add_permanently_hidden_id,
      remove_dismissed_id,
      remove_permanently_hidden_id,
      rewards_optout,
      how_to_earn_modal_seen,
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

    // Allow null to clear the category
    if (creator_category !== null) {
      if (!validateCreatorCategory(creator_category)) {
        return NextResponse.json(
          { error: getCreatorCategoryErrorMessage(creator_category) },
          { status: 400 },
        );
      }
    }

    const result = await updateUserPreferencesAtomic({
      talent_uuid,
      creator_category,
      add_dismissed_id,
      add_permanently_hidden_id,
      remove_dismissed_id,
      remove_permanently_hidden_id,
      rewards_optout,
      how_to_earn_modal_seen,
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

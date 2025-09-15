import { NextRequest, NextResponse } from "next/server";
import { validateTalentUUID } from "@/lib/validation";
import {
  getBase200UserPreferencesByTalentUuid,
  updateBase200UserPreferencesAtomic,
} from "@/app/services/base200UserPreferencesService";
import {
  Base200UserPreferencesResponse,
  Base200UserPreferencesUpdateRequest,
  Base200UserPreferencesError,
} from "@/lib/types/base200-user-preferences";

export async function GET(
  req: NextRequest,
): Promise<
  NextResponse<Base200UserPreferencesResponse | Base200UserPreferencesError>
> {
  try {
    const { searchParams } = new URL(req.url);
    const talent_uuid = searchParams.get("talent_uuid");

    if (!talent_uuid) {
      return NextResponse.json(
        { error: "Missing talent_uuid parameter" },
        { status: 400 },
      );
    }

    if (!validateTalentUUID(talent_uuid)) {
      return NextResponse.json(
        { error: "Invalid talent_uuid format" },
        { status: 400 },
      );
    }

    const result = await getBase200UserPreferencesByTalentUuid(talent_uuid);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching BASE200 user preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
): Promise<
  NextResponse<Base200UserPreferencesResponse | Base200UserPreferencesError>
> {
  try {
    const {
      talent_uuid,
      add_dismissed_id,
      add_permanently_hidden_id,
      remove_dismissed_id,
      remove_permanently_hidden_id,
    }: Base200UserPreferencesUpdateRequest = await req.json();

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

    const result = await updateBase200UserPreferencesAtomic({
      talent_uuid,
      add_dismissed_id,
      add_permanently_hidden_id,
      remove_dismissed_id,
      remove_permanently_hidden_id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating BASE200 user preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}

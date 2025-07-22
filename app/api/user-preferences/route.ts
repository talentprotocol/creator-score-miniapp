import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";
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
    const { data, error } = await supabase
      .from("user_preferences")
      .select("creator_category")
      .eq("talent_uuid", talentUUID)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - user has no preferences
        return NextResponse.json({ creator_category: null });
      }
      throw error;
    }

    return NextResponse.json({
      creator_category: data?.creator_category || null,
    });
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
    const { talent_uuid, creator_category }: UserPreferencesUpdateRequest =
      await req.json();

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

    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          talent_uuid,
          creator_category,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "talent_uuid",
        },
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}

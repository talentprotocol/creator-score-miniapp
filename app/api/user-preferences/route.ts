import { NextRequest, NextResponse } from "next/server";

// Simple direct database connection for now
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const talentUUID = searchParams.get("talent_uuid");

  if (!talentUUID) {
    return NextResponse.json({ error: "Missing talent_uuid" }, { status: 400 });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase configuration");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/user_preferences?talent_uuid=eq.${talentUUID}&select=creator_category`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404 || response.status === 401) {
        return NextResponse.json({ creator_category: null });
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const category = data.length > 0 ? data[0].creator_category : null;

    return NextResponse.json({ creator_category: category });
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { talent_uuid, creator_category } = await req.json();

    if (!talent_uuid) {
      return NextResponse.json(
        { error: "Missing talent_uuid" },
        { status: 400 },
      );
    }

    // Allow null to clear the category
    if (creator_category !== null) {
      // Validate category
      const validCategories = [
        "Artist",
        "Video",
        "Writer",
        "Social",
        "Music",
        "Podcast",
        "Curator",
      ];
      if (!validCategories.includes(creator_category)) {
        return NextResponse.json(
          { error: "Invalid creator_category" },
          { status: 400 },
        );
      }
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("Missing Supabase configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_preferences`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        talent_uuid,
        creator_category,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Supabase upsert might return empty response, which is normal
    let data = null;
    const responseText = await response.text();
    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // Supabase upsert returns empty response, which is normal
      }
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

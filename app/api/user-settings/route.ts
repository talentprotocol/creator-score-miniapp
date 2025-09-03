import { NextRequest, NextResponse } from "next/server";
import { TalentApiClient } from "@/lib/talent-api-client";
import { extractTalentProtocolParams } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userAuthToken = req.headers.get("x-talent-auth-token") || undefined;
  const client = new TalentApiClient({ userAuthToken });

  // Support `uuid` alias by mapping it to `talent_protocol_id`
  const uuid = searchParams.get("uuid");
  if (uuid) {
    searchParams.set("talent_protocol_id", uuid);
    searchParams.delete("uuid");
  }

  // If we have a numeric id, assume it's a Farcaster FID
  const id = searchParams.get("talent_protocol_id") || searchParams.get("id");
  if (id && !isNaN(Number(id))) {
    searchParams.set("account_source", "farcaster");
  }

  const params = extractTalentProtocolParams(searchParams);

  if (!params.id && !params.talent_protocol_id) {
    return NextResponse.json(
      { error: "Missing required parameter: id or talent_protocol_id" },
      { status: 400 },
    );
  }

  try {
    const response = await client.getProfile(params);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch profile (HTTP ${response.status})` },
        { status: response.status },
      );
    }

    // getProfile already normalizes and spreads the Talent profile
    const profile = await response.json();

    // Best-effort email extraction from known places
    const email: string | null = profile.user?.email || null;

    const userSettings = {
      email,
      notifications: {
        farcaster: true, // default enabled
        email: false, // default disabled for now
      },
    };

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error("Error in user-settings API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 },
    );
  }
}



import { NextRequest, NextResponse } from "next/server";
import { TalentApiClient } from "@/lib/talent-api-client";

export async function GET(req: NextRequest) {
  try {
    const userAuthToken = req.headers.get("x-talent-auth-token") || undefined;
    if (!userAuthToken) {
      return NextResponse.json(
        { error: "Missing x-talent-auth-token header" },
        { status: 401 },
      );
    }

    const client = new TalentApiClient({ userAuthToken });
    const resp = await client.getMyProfile();
    return resp;
  } catch (error) {
    console.error("[TalentAuth] me:error", error);
    return NextResponse.json(
      { error: "Failed to fetch current user" },
      { status: 500 },
    );
  }
}



import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/app/services/userProfileService";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const talentUuid = searchParams.get("talentUuid");

  if (!talentUuid) {
    return NextResponse.json(
      { error: "talentUuid parameter is required" },
      { status: 400 },
    );
  }

  const profile = await getUserProfile(talentUuid);
  return NextResponse.json(profile);
}

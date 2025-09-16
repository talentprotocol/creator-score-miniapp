import { NextRequest, NextResponse } from "next/server";
import { getTop200LeaderboardEntries } from "@/app/services/leaderboardService";
import { getUserProfileData } from "@/app/services/creatorScoreLeaderboardService";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const talentUuid = searchParams.get("talentUuid");

    const result = await getTop200LeaderboardEntries();

    // Get pinned user data if talentUuid is provided
    let pinnedUser = null;
    if (talentUuid) {
      console.log("Fetching pinned user data for rewards:", talentUuid);
      pinnedUser = await getUserProfileData(talentUuid);
      console.log("Pinned user result for rewards:", pinnedUser);
    }

    const response = {
      ...result,
      pinnedUser,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "Failed to fetch snapshot leaderboard data from supabase:",
      error,
    );
    return NextResponse.json(
      { error: "Failed to fetch snapshot leaderboard data from supabase" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  getCreatorScoreLeaderboard,
  getUserProfileData,
} from "@/app/services/creatorScoreLeaderboardService";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const talentUuid = searchParams.get("talentUuid");

    // Validate parameters
    if (offset < 0) {
      return NextResponse.json(
        { error: "Offset must be non-negative" },
        { status: 400 },
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 },
      );
    }

    // Get leaderboard data
    const leaderboardData = await getCreatorScoreLeaderboard(offset, limit);

    // Get pinned user data if talentUuid is provided
    let pinnedUser = null;
    if (talentUuid) {
      pinnedUser = await getUserProfileData(talentUuid);
    }

    const response = {
      ...leaderboardData,
      pinnedUser,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch creator score leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator score leaderboard" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  getBasecampLeaderboard,
  getUserBasecampRank,
} from "@/app/services/basecampLeaderboardService";
import { SortColumn, SortOrder, BasecampTab } from "@/lib/types/basecamp";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get("offset") || "0");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = (searchParams.get("sortBy") ||
      "base200_score") as SortColumn;
    const sortOrder = (searchParams.get("sortOrder") || "desc") as SortOrder;
    const talentUuid = searchParams.get("talentUuid");
    const tab = (searchParams.get("tab") || "reputation") as BasecampTab;

    const [leaderboardData, pinnedUser] = await Promise.all([
      getBasecampLeaderboard(offset, limit, sortBy, sortOrder, tab),
      talentUuid ? getUserBasecampRank(talentUuid, tab) : null,
    ]);

    return NextResponse.json({
      ...leaderboardData,
      pinnedUser,
    });
  } catch (error) {
    console.error("Basecamp leaderboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 },
    );
  }
}

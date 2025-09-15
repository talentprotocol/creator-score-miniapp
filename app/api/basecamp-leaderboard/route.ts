import { NextRequest, NextResponse } from "next/server";
import { getBasecampLeaderboard } from "@/app/services/basecampLeaderboardService";
import { SortColumn, SortOrder, BasecampTab } from "@/lib/types/basecamp";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const offset = parseInt(searchParams.get("offset") || "0");
    const limit = parseInt(searchParams.get("limit") || "50");
    // Get tab-specific default sort column
    const getDefaultSortColumn = (tabValue: BasecampTab): SortColumn => {
      switch (tabValue) {
        case "coins":
          // Both mobile and desktop sort by 24h volume by default
          return "zora_creator_coin_24h_volume";
        case "creator":
          return "creator_score";
        case "builder":
          return "rewards_amount";
        default:
          return "total_earnings";
      }
    };

    const tab = (searchParams.get("tab") || "coins") as BasecampTab;
    const sortBy = (searchParams.get("sortBy") ||
      getDefaultSortColumn(tab)) as SortColumn;
    const sortOrder = (searchParams.get("sortOrder") || "desc") as SortOrder;

    const leaderboardData = await getBasecampLeaderboard(
      offset,
      limit,
      sortBy,
      sortOrder,
      tab,
    );

    return NextResponse.json(leaderboardData);
  } catch (error) {
    console.error("Basecamp leaderboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 },
    );
  }
}

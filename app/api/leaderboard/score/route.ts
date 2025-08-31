import { NextResponse } from "next/server";
import { getTop200LeaderboardEntries } from "@/app/services/scoreLeaderboardService";

export const maxDuration = 60;

export async function GET() {
  try {
    const result = await getTop200LeaderboardEntries();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch score leaderboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch score leaderboard data" },
      { status: 500 },
    );
  }
}

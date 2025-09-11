import { NextResponse } from "next/server";
import { getTop200LeaderboardEntries } from "@/app/services/leaderboardService";

export const maxDuration = 60;

export async function GET() {
  try {
    const result = await getTop200LeaderboardEntries();

    return NextResponse.json(result);
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

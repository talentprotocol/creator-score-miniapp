import { NextResponse } from "next/server";
import { getTop200LeaderboardEntries } from "@/app/services/scoreLeaderboardService";

export const maxDuration = 60;

export async function GET() {
  try {
    console.log("[API] /api/leaderboard/score called");
    const result = await getTop200LeaderboardEntries();
    console.log("[API] Score leaderboard result:", {
      entryCount: result.entries.length,
      firstEntry: result.entries[0] ? {
        name: result.entries[0].name,
        talent_protocol_id: result.entries[0].talent_protocol_id,
        rank: result.entries[0].rank,
        score: result.entries[0].score
      } : null
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch score leaderboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch score leaderboard data" },
      { status: 500 },
    );
  }
}

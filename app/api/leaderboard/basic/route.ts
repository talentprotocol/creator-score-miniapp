import { NextResponse } from "next/server";
import { getTop200LeaderboardEntries } from "@/app/services/leaderboardService";

export const maxDuration = 60;

export async function GET() {
  try {
    console.log("[API] /api/leaderboard/basic called");
    const result = await getTop200LeaderboardEntries();
    console.log("[API] Leaderboard result:", {
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
    console.error("Failed to fetch leaderboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 },
    );
  }
}

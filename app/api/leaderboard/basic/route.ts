import { NextResponse } from "next/server";
import { getTop200LeaderboardEntries } from "@/app/services/leaderboardService";

export const maxDuration = 60;

export async function GET() {
  try {
    console.log("[API] /api/leaderboard/basic called");
    const result = await getTop200LeaderboardEntries();
    console.log("[API] Snapshot leaderboard result:", {
      entryCount: result.entries.length,
      firstEntry: result.entries[0] ? {
        name: result.entries[0].name,
        talent_protocol_id: result.entries[0].talent_protocol_id,
        rank: result.entries[0].rank,
        score: result.entries[0].score
      } : null
    });
    
    // Return response with no-cache headers to prevent any caching
    return new NextResponse(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Failed to fetch snapshot leaderboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch snapshot leaderboard data" },
      { status: 500 },
    );
  }
}

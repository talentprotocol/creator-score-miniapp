import { NextResponse } from "next/server";
import { getTop200LeaderboardEntries } from "@/app/services/leaderboardService";

export const maxDuration = 60;

export async function GET() {
  try {
    const result = await getTop200LeaderboardEntries();
    
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

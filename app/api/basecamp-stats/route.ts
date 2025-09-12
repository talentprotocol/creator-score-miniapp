import { NextResponse } from "next/server";
import { getBasecampStats } from "@/app/services/basecampLeaderboardService";

export async function GET() {
  try {
    const stats = await getBasecampStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Basecamp stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}

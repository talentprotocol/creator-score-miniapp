import { NextResponse } from "next/server";
import { getActiveCreatorsCount } from "@/app/services/leaderboardService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const total = await getActiveCreatorsCount();
    return NextResponse.json({ total });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch active creators count" },
      { status: 500 },
    );
  }
}

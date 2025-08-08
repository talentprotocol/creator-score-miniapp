import { NextResponse } from "next/server";
import { getBoostedProfilesData } from "@/app/services/leaderboardService";
import { createServerErrorResponse, logApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const boostedProfiles = await getBoostedProfilesData();
    return NextResponse.json({ profiles: boostedProfiles });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logApiError("boosted-profiles", "fetch", errorMessage);
    return createServerErrorResponse("Failed to fetch boosted profiles");
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCachedUserTokenBalance } from "@/app/services/tokenBalanceService";

export async function GET(req: NextRequest) {
  try {
    // Get API key from environment variables
    const apiKey = process.env.TALENT_API_KEY;
    if (!apiKey) {
      // Return fallback data when API key is not configured (development)
      return NextResponse.json({
        balance: 0,
        talentUuid: req.nextUrl.searchParams.get("talentUuid"),
        timestamp: new Date().toISOString(),
        fallback: true,
      });
    }

    // Get talentUuid from query params
    const { searchParams } = new URL(req.url);
    const talentUuid = searchParams.get("talentUuid");

    if (!talentUuid) {
      return NextResponse.json(
        { error: "talentUuid parameter is required" },
        { status: 400 },
      );
    }

    // Get cached token balance
    const balance = await getCachedUserTokenBalance(apiKey, talentUuid);

    return NextResponse.json({
      balance,
      talentUuid,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to fetch token balance",
        fallback: true,
      },
      { status: 500 },
    );
  }
}

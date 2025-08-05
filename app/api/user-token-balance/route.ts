import { NextRequest, NextResponse } from "next/server";
import { getCachedUserTokenBalance } from "@/app/services/tokenBalanceService";

export async function GET(req: NextRequest) {
  console.log(`🔄 [USER TOKEN BALANCE API] Starting token balance request`);

  try {
    // Get API key from environment variables
    const apiKey = process.env.TALENT_API_KEY;
    if (!apiKey) {
      console.warn(
        `⚠️ [USER TOKEN BALANCE API] No API key configured, returning fallback data`,
      );
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
      console.error(`❌ [USER TOKEN BALANCE API] Missing talentUuid parameter`);
      return NextResponse.json(
        { error: "talentUuid parameter is required" },
        { status: 400 },
      );
    }

    console.log(
      `🔄 [USER TOKEN BALANCE API] Fetching token balance for talentUuid: ${talentUuid}`,
    );

    // Get cached token balance
    const balance = await getCachedUserTokenBalance(apiKey, talentUuid);

    console.log(
      `✅ [USER TOKEN BALANCE API] Successfully retrieved token balance: ${balance} for talentUuid: ${talentUuid}`,
    );

    return NextResponse.json({
      balance,
      talentUuid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ [USER TOKEN BALANCE API] Error in user-token-balance API:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to fetch token balance",
        fallback: true,
      },
      { status: 500 },
    );
  }
}

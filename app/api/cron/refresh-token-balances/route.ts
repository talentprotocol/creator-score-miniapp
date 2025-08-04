import { NextResponse } from "next/server";
import { getCachedTokenBalances } from "../../../services/tokenBalanceService";

export async function GET() {
  try {
    const apiKey = process.env.TALENT_API_KEY;

    if (!apiKey) {
      console.error("❌ TALENT_API_KEY not found in environment");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      );
    }

    console.log("🔄 Cron job: Starting token balance refresh...");

    // This will trigger the cache refresh
    const result = await getCachedTokenBalances(apiKey);

    console.log("✅ Cron job: Token balance refresh completed successfully");
    console.log(
      `📊 Updated ${Object.keys(result.tokenBalances).length} profiles`,
    );
    console.log(
      `🎯 ${Object.values(result.tokenBalances).filter((data) => data.isBoosted).length} boosted creators`,
    );

    return NextResponse.json({
      success: true,
      message: "Token balance cache refreshed successfully",
      stats: {
        totalProfiles: Object.keys(result.tokenBalances).length,
        boostedCreators: Object.values(result.tokenBalances).filter(
          (data) => data.isBoosted,
        ).length,
        lastUpdated: result.lastUpdated,
        nextUpdate: result.nextUpdate,
      },
    });
  } catch (error) {
    console.error("❌ Cron job: Error refreshing token balances:", error);

    return NextResponse.json(
      {
        error: "Failed to refresh token balances",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

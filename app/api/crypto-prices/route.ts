import { NextResponse } from "next/server";

/**
 * GET /api/crypto-prices
 *
 * Server-side API for fetching cryptocurrency prices with caching.
 * Replaces client-side price fetching to avoid rate limiting and follow coding principles.
 *
 * Returns:
 * {
 *   ethPrice: number,
 *   polPrice: number
 * }
 */
export const revalidate = 3600; // 1 hour server cache

export async function GET() {
  try {
    const [ethResponse, polResponse] = await Promise.all([
      fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot"),
      fetch("https://api.coinbase.com/v2/prices/MATIC-USD/spot"),
    ]);

    if (!ethResponse.ok || !polResponse.ok) {
      throw new Error(
        `Coinbase API error: ETH=${ethResponse.status}, POL=${polResponse.status}`,
      );
    }

    const [ethData, polData] = await Promise.all([
      ethResponse.json(),
      polResponse.json(),
    ]);

    const ethPrice = parseFloat(ethData.data?.amount);
    const polPrice = parseFloat(polData.data?.amount);

    if (isNaN(ethPrice) || isNaN(polPrice) || ethPrice <= 0 || polPrice <= 0) {
      throw new Error("Invalid price data from Coinbase");
    }

    return NextResponse.json(
      { ethPrice, polPrice },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
        },
      },
    );
  } catch (error) {
    console.error("[crypto-prices] Fetch failed:", error);

    // Return more realistic fallback prices
    return NextResponse.json(
      { ethPrice: 4300, polPrice: 0.3 },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600", // Shorter cache for fallbacks
        },
      },
    );
  }
}

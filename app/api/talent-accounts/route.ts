import { NextRequest, NextResponse } from "next/server";
import { extractTalentProtocolParams } from "@/lib/api-utils";
import { getWalletAccountsForTalentId } from "@/app/services/walletAccountsService";

export async function GET(req: NextRequest) {
  try {
    const params = extractTalentProtocolParams(req.nextUrl.searchParams);

    if (!params.id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 },
      );
    }

    // ✅ FIXED: Call service layer instead of API client directly
    const data = await getWalletAccountsForTalentId(params.id);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in talent-accounts API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet accounts" },
      { status: 500 },
    );
  }
}

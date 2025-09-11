import { NextRequest, NextResponse } from "next/server";
import { extractTalentProtocolParams } from "@/lib/api-utils";
import { getAccountsForTalentId } from "@/app/services/accountsService";

export async function GET(req: NextRequest) {
  try {
    const params = extractTalentProtocolParams(req.nextUrl.searchParams);

    if (!params.id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 },
      );
    }

    // Call the unified accounts service
    const data = await getAccountsForTalentId(params.id)();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in accounts API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 },
    );
  }
}

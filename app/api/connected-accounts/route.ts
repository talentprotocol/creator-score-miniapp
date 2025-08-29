import { NextRequest, NextResponse } from "next/server";
import { extractTalentProtocolParams } from "@/lib/api-utils";
import { getConnectedAccountsForTalentId } from "@/app/services/connectedAccountsService";

export async function GET(req: NextRequest) {
  try {
    const params = extractTalentProtocolParams(req.nextUrl.searchParams);

    if (!params.id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 },
      );
    }

    // Call the connected accounts service that returns the expected structure
    const data = await getConnectedAccountsForTalentId(params.id)();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in connected-accounts API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch connected accounts" },
      { status: 500 },
    );
  }
}

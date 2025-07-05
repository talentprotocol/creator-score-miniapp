import { NextRequest } from "next/server";
import { talentApiClient } from "@/lib/talent-api-client";
import { extractTalentProtocolParams } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = extractTalentProtocolParams(searchParams);

  return talentApiClient.getScore(params);
}

// Keep POST endpoint for backward compatibility
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { address, fid, scorer_slug, account_source = "wallet" } = body;

  const params = {
    address,
    fid,
    scorer_slug,
    account_source,
  };

  return talentApiClient.getScore(params);
}

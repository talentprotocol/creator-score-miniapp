import { NextRequest } from "next/server";
import { talentApiClient } from "@/lib/talent-api-client";
import { extractTalentProtocolParams } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Handle uuid parameter by mapping it to talent_protocol_id
  const uuid = searchParams.get("uuid");
  if (uuid) {
    searchParams.set("talent_protocol_id", uuid);
    searchParams.delete("uuid");
  }

  const params = extractTalentProtocolParams(searchParams);

  // Default to creator_score if no scorer_slug is provided
  if (!params.scorer_slug) {
    params.scorer_slug = "creator_score";
  }

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

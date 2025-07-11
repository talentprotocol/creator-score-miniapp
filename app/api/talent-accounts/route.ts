import { NextRequest } from "next/server";
import { extractTalentProtocolParams } from "@/lib/api-utils";
import { talentApiClient } from "@/lib/talent-api-client";

export async function GET(req: NextRequest) {
  const params = extractTalentProtocolParams(req.nextUrl.searchParams);
  return talentApiClient.getAccounts(params);
}

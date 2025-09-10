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

  const response = await talentApiClient.getSocials(params);

  // Add HTTP cache headers for browser caching
  if (response instanceof Response) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=600",
    );
  }

  return response;
}

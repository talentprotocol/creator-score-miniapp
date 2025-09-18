import { NextRequest } from "next/server";
import { TalentApiClient } from "@/lib/talent-api-client";
import { extractTalentProtocolParams } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userAuthToken = req.headers.get("x-talent-auth-token") || undefined;
  const client = new TalentApiClient({ userAuthToken });

  // Handle uuid parameter by mapping it to talent_protocol_id
  const uuid = searchParams.get("uuid");
  if (uuid) {
    searchParams.set("talent_protocol_id", uuid);
    searchParams.delete("uuid");
  }

  const params = extractTalentProtocolParams(searchParams);

  return client.getPosts(params);
}

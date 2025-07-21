import { NextRequest } from "next/server";
import { getAccountSource } from "@/lib/user-resolver";
import { talentApiClient } from "@/lib/talent-api-client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return talentApiClient.getProfile({ id: null });
  }

  const account_source = getAccountSource(id);

  // For UUIDs, use talent_protocol_id to avoid account_source logic
  const params =
    account_source === null
      ? { talent_protocol_id: id }
      : { id, account_source };

  return talentApiClient.getProfile(params);
}

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

  return talentApiClient.getProfile({
    id,
    account_source,
  });
}

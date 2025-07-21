import { NextRequest } from "next/server";
import { talentApiClient } from "@/lib/talent-api-client";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { talent_protocol_id } = body;

  if (!talent_protocol_id) {
    return new Response(
      JSON.stringify({ error: "Missing talent_protocol_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const params = {
    talent_protocol_id,
    scorer_slug: "creator_score",
  };

  const result = await talentApiClient.refreshScore(params);

  return result;
}

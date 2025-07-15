import { NextRequest } from "next/server";
import { talentApiClient } from "@/lib/talent-api-client";

export async function POST(req: NextRequest) {
  console.log("🚀 /api/talent-score-refresh called");

  const body = await req.json();
  console.log("📥 Request body:", body);

  const { talent_protocol_id } = body;

  if (!talent_protocol_id) {
    console.log("❌ Missing talent_protocol_id");
    return new Response(
      JSON.stringify({ error: "Missing talent_protocol_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const params = {
    talent_protocol_id,
    scorer_slug: "creator_score",
  };

  console.log("📤 Calling talentApiClient.refreshScore with params:", params);

  const result = await talentApiClient.refreshScore(params);
  console.log("📥 talentApiClient.refreshScore result:", result);

  return result;
}

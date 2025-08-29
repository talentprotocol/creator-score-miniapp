import { NextRequest } from "next/server";
import { talentApiClient } from "@/lib/talent-api-client";
import { getTokenBalanceForProfileManual } from "@/app/services/scoreRefreshService";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { talent_protocol_id } = body;

  if (!talent_protocol_id) {
    return new Response(
      JSON.stringify({ error: "Missing talent_protocol_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // Step 1: Refresh score
    const params = {
      talent_protocol_id,
      scorer_slug: "creator_score",
    };

    const result = await talentApiClient.refreshScore(params);

    // Step 2: Refresh token balance (server-side)
    try {
      await getTokenBalanceForProfileManual(String(talent_protocol_id));
    } catch (tokenError) {
      console.warn(`⚠️ [API] Token balance refresh failed:`, tokenError);
      // Don't fail the entire operation if token refresh fails
    }

    return result;
  } catch (error) {
    console.error(
      `❌ [API] Score refresh failed for talent ID ${talent_protocol_id}:`,
      error,
    );
    return new Response(
      JSON.stringify({
        error: "Failed to refresh score",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

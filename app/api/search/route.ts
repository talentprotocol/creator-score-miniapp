import { NextRequest } from "next/server";
import { talentApiClient } from "@/lib/talent-api-client";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("query");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const perPage = parseInt(searchParams.get("per_page") || "10", 10);

  if (!query || query.trim().length < 2) {
    return new Response(
      JSON.stringify({ error: "Query must be at least 2 characters long" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const response = await talentApiClient.searchProfiles({
      query: query.trim(),
      page,
      per_page: perPage,
    });

    // The talentApiClient.searchProfiles returns a NextResponse
    // We need to extract the JSON data from it
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to search profiles" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

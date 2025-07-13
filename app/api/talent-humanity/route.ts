import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    console.error("TALENT_API_KEY not configured");
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  console.log(`Fetching humanity credentials for talent_id: ${id}`);

  try {
    const url = `https://api.talentprotocol.com/human_checkmark/data_points?id=${id}`;
    console.log(`Making request to: ${url}`);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} - ${errorText}`);

      if (response.status === 404) {
        return Response.json({ credentials: [] });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Received ${data.credentials?.length || 0} credentials`);

    return Response.json(data);
  } catch (error: unknown) {
    console.error("Error fetching humanity credentials:", error);

    // Return empty credentials on error instead of failing
    return Response.json({ credentials: [] });
  }
}

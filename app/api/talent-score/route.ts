import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.TALENT_API_KEY;
    if (!apiKey) {
      console.error("TALENT_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const params = new URLSearchParams({
      id: address,
      account_source: "wallet",
    });
    const fullUrl = `https://api.talentprotocol.com/score?${params.toString()}`;

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "X-API-KEY": apiKey,
        Accept: "application/json",
      },
    });

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Unexpected response from Talent API:", text);
      data = { error: "Invalid response from Talent API" };
    }

    if (!response.ok) {
      console.error("Talent API error:", data);
      return NextResponse.json(
        { error: data.error || "Failed to fetch talent score" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in talent-score API:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const scorerSlug = searchParams.get("scorer_slug");

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.TALENT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const params = new URLSearchParams({
      id: address,
      account_source: "wallet",
    });

    // Add scorer_slug if provided
    if (scorerSlug) {
      params.append("scorer_slug", scorerSlug);
    }

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
      // Only log unexpected response format as it's a critical error
      console.error(
        `[Talent API] Unexpected response format for address ${address}${scorerSlug ? ` (scorer: ${scorerSlug})` : ""}`,
      );
      data = { error: "Invalid response from Talent API" };
    }

    if (!response.ok) {
      // Log API errors with context for debugging
      console.error(
        `[Talent API] Error for address ${address}${scorerSlug ? ` (scorer: ${scorerSlug})` : ""}: ${data.error || response.statusText}`,
      );
      return NextResponse.json(
        { error: data.error || "Failed to fetch talent score" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    // Log unexpected errors with context
    console.error(
      `[Talent API] Unexpected error for address ${req.url}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return NextResponse.json(
      { error: "Failed to process talent score request" },
      { status: 500 },
    );
  }
}

// Keep POST endpoint for backward compatibility
export async function POST(req: NextRequest) {
  try {
    const { address, scorer_slug } = await req.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.TALENT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const params = new URLSearchParams({
      id: address,
      account_source: "wallet",
    });

    // Add scorer_slug if provided
    if (scorer_slug) {
      params.append("scorer_slug", scorer_slug);
    }

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
      // Only log unexpected response format as it's a critical error
      console.error(
        `[Talent API] Unexpected response format for address ${address}${scorer_slug ? ` (scorer: ${scorer_slug})` : ""}`,
      );
      data = { error: "Invalid response from Talent API" };
    }

    if (!response.ok) {
      // Log API errors with context for debugging
      console.error(
        `[Talent API] Error for address ${address}${scorer_slug ? ` (scorer: ${scorer_slug})` : ""}: ${data.error || response.statusText}`,
      );
      return NextResponse.json(
        { error: data.error || "Failed to fetch talent score" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    // Log unexpected errors with context
    console.error(
      `[Talent API] Unexpected error for address ${req.url}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return NextResponse.json(
      { error: "Failed to process talent score request" },
      { status: 500 },
    );
  }
}

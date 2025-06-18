import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = process.env.TALENT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }
    const scorerSlug = searchParams.get("scorer_slug");
    // Handle talent_protocol_id or id at the very top
    const talentId =
      searchParams.get("talent_protocol_id") || searchParams.get("id");
    if (talentId) {
      // Fetch by talent_protocol_id (or fallback to id), no account_source
      const params = new URLSearchParams({ id: talentId });
      if (scorerSlug) params.append("scorer_slug", scorerSlug);
      const baseUrl = "https://api.talentprotocol.com/score";
      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "X-API-KEY": apiKey,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { error: data.error || "Failed to fetch talent score" },
          { status: response.status },
        );
      }
      return NextResponse.json(data);
    }

    const address = searchParams.get("address");
    const fid = searchParams.get("fid");
    const accountSource = searchParams.get("account_source") || "wallet";

    // Validate required parameters based on account source
    if (accountSource === "wallet" && !address) {
      return NextResponse.json(
        { error: "Address is required for wallet-based lookup" },
        { status: 400 },
      );
    }

    if (accountSource === "farcaster" && !fid) {
      return NextResponse.json(
        { error: "Farcaster ID (fid) is required for Farcaster-based lookup" },
        { status: 400 },
      );
    }

    const params = new URLSearchParams();

    // Set parameters based on account source
    if (accountSource === "wallet") {
      params.append("id", address!);
    } else if (accountSource === "farcaster") {
      params.append("id", fid!);
    }
    params.append("account_source", accountSource);

    // Add scorer_slug if provided
    if (scorerSlug) {
      params.append("scorer_slug", scorerSlug);
    }

    // Use different endpoints based on account source
    const baseUrl = "https://api.talentprotocol.com/score";

    const fullUrl = `${baseUrl}?${params.toString()}`;

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
      const identifier = accountSource === "wallet" ? address : fid;
      console.error(
        `[Talent API] Unexpected response format for ${accountSource} ${identifier}${scorerSlug ? ` (scorer: ${scorerSlug})` : ""}`,
      );
      data = { error: "Invalid response from Talent API" };
    }

    if (!response.ok) {
      const identifier = accountSource === "wallet" ? address : fid;
      console.error(
        `[Talent API] Error for ${accountSource} ${identifier}${scorerSlug ? ` (scorer: ${scorerSlug})` : ""}: ${data.error || response.statusText}`,
      );
      return NextResponse.json(
        { error: data.error || "Failed to fetch talent score" },
        { status: response.status },
      );
    }

    // Transform Farcaster response to match wallet response format
    if (accountSource === "farcaster" && data.scores?.[0]) {
      data = {
        score: {
          points: data.scores[0].points,
          last_calculated_at: data.scores[0].last_calculated_at,
        },
      };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      `[Talent API] Unexpected error for request ${req.url}: ${error instanceof Error ? error.message : "Unknown error"}`,
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
    const {
      address,
      fid,
      scorer_slug,
      account_source = "wallet",
    } = await req.json();

    // Validate required parameters based on account source
    if (account_source === "wallet" && !address) {
      return NextResponse.json(
        { error: "Address is required for wallet-based lookup" },
        { status: 400 },
      );
    }

    if (account_source === "farcaster" && !fid) {
      return NextResponse.json(
        { error: "Farcaster ID (fid) is required for Farcaster-based lookup" },
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

    const params = new URLSearchParams();

    // Set parameters based on account source
    if (account_source === "wallet") {
      params.append("id", address);
    } else if (account_source === "farcaster") {
      params.append("id", fid);
    }
    params.append("account_source", account_source);

    // Add scorer_slug if provided
    if (scorer_slug) {
      params.append("scorer_slug", scorer_slug);
    }

    // Use different endpoints based on account source
    const baseUrl = "https://api.talentprotocol.com/score";

    const fullUrl = `${baseUrl}?${params.toString()}`;

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
      const identifier = account_source === "wallet" ? address : fid;
      console.error(
        `[Talent API] Unexpected response format for ${account_source} ${identifier}${scorer_slug ? ` (scorer: ${scorer_slug})` : ""}`,
      );
      data = { error: "Invalid response from Talent API" };
    }

    if (!response.ok) {
      const identifier = account_source === "wallet" ? address : fid;
      console.error(
        `[Talent API] Error for ${account_source} ${identifier}${scorer_slug ? ` (scorer: ${scorer_slug})` : ""}: ${data.error || response.statusText}`,
      );
      return NextResponse.json(
        { error: data.error || "Failed to fetch talent score" },
        { status: response.status },
      );
    }

    // Transform Farcaster response to match wallet response format
    if (account_source === "farcaster" && data.scores?.[0]) {
      data = {
        score: {
          points: data.scores[0].points,
          last_calculated_at: data.scores[0].last_calculated_at,
        },
      };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      `[Talent API] Unexpected error for request ${req.url}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return NextResponse.json(
      { error: "Failed to process talent score request" },
      { status: 500 },
    );
  }
}

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
    // Handle talent_protocol_id or id at the very top
    const talentId =
      searchParams.get("talent_protocol_id") || searchParams.get("id");
    if (talentId) {
      // Fetch by talent_protocol_id (or fallback to id), forward scorer_slug if present
      const params = new URLSearchParams({ id: talentId });
      const scorerSlug = searchParams.get("scorer_slug");
      if (scorerSlug) params.append("scorer_slug", scorerSlug);
      const baseUrl = "https://api.talentprotocol.com/credentials";
      const headers = {
        "X-API-KEY": apiKey,
        Accept: "application/json",
      };
      const fullUrl = `${baseUrl}?${params.toString()}`;
      const response = await fetch(fullUrl, { headers });
      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to fetch credentials" },
          { status: response.status },
        );
      }
      const data = await response.json();
      return NextResponse.json(data);
    }

    const address = searchParams.get("address");
    const fid = searchParams.get("fid");
    const scorerSlug = searchParams.get("scorer_slug");
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
    const baseUrl = "https://api.talentprotocol.com/credentials"; // Always use the default credentials endpoint
    const headers = {
      "X-API-KEY": apiKey,
      Accept: "application/json",
    };

    const fullUrl = `${baseUrl}?${params.toString()}`;

    const response = await fetch(fullUrl, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

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
        { error: data.error || "Failed to fetch credentials" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      `[Talent API] Unexpected error for request ${req.url}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return NextResponse.json(
      { error: "Failed to process credentials request" },
      { status: 500 },
    );
  }
}

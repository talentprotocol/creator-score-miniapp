import { NextRequest, NextResponse } from "next/server";
import { extractTalentProtocolParams } from "@/lib/api-utils";
import { getConnectedAccountsForTalentId } from "@/app/services/connectedAccountsService";
import { CACHE_KEYS } from "@/lib/cache-keys";
import { revalidateTag } from "next/cache";
import { TalentApiClient } from "@/lib/talent-api-client";

export async function GET(req: NextRequest) {
  try {
    const params = extractTalentProtocolParams(req.nextUrl.searchParams);

    if (!params.id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 },
      );
    }

    // Call the connected accounts service that returns the expected structure
    const data = await getConnectedAccountsForTalentId(params.id)();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in connected-accounts API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch connected accounts" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userAuthToken = req.headers.get("x-talent-auth-token") || undefined;
    const client = new TalentApiClient({ userAuthToken });

    const body = await req.json();
    const platform = (body?.platform || "").toLowerCase();

    if (!platform || !["github", "twitter", "linkedin"].includes(platform)) {
      return NextResponse.json(
        { error: "Missing or invalid platform. Use github, twitter, or linkedin." },
        { status: 400 },
      );
    }

    // Perform disconnect with end-user auth
    const resp = await client.disconnectAccount(platform as "github" | "twitter" | "linkedin");

    // Revalidate connected accounts cache best-effort
    try {
      revalidateTag(CACHE_KEYS.CONNECTED_ACCOUNTS);
    } catch {}

    return resp;
  } catch (error) {
    console.error("Error in connected-accounts PUT route:", error);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userAuthToken = req.headers.get("x-talent-auth-token") || undefined;
    const client = new TalentApiClient({ userAuthToken });

    const body = await req.json();
    const { address, signature, chain_id } = body || {};

    if (!address || !signature || !chain_id) {
      return NextResponse.json(
        { error: "Missing required fields: address, signature, chain_id" },
        { status: 400 },
      );
    }

    const resp = await client.connectWalletAccount({ address, signature, chain_id });

    // Revalidate connected accounts cache best-effort
    try {
      revalidateTag(CACHE_KEYS.CONNECTED_ACCOUNTS);
    } catch {}

    return resp;
  } catch (error) {
    console.error("Error in connected-accounts POST route:", error);
    return NextResponse.json(
      { error: "Failed to connect wallet account" },
      { status: 500 },
    );
  }
}

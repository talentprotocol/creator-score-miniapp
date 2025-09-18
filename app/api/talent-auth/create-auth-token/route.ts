import { NextRequest, NextResponse } from "next/server";
import { createTalentAuthToken } from "@/lib/talent-api-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Expect: { address, chain_id, signature, siwe_message? }
    const { address, chain_id, signature, siwe_message } = body || {};
    if (!address || !signature || !chain_id) {
      return NextResponse.json(
        { error: "Missing required fields: address, signature, chain_id" },
        { status: 400 },
      );
    }
    if (siwe_message && typeof siwe_message === "string") {
      return await createTalentAuthToken({ address, signature, chain_id, siwe_message });
    }
    // Legacy: no siwe_message
    return await createTalentAuthToken({ address, signature, chain_id });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to create auth token: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}



import { NextRequest, NextResponse } from "next/server";
import { createTalentAuthNonce } from "@/lib/talent-api-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const address: string | undefined = body?.address;
    const chain_id: number | undefined = body?.chain_id;

    if (!address) {
      return NextResponse.json(
        { error: "Missing required field: address" },
        { status: 400 },
      );
    }

    const resp = await createTalentAuthNonce(address, chain_id);
    return resp;
  } catch (err) {
    console.error(`Failed to create nonce`, err);
    return NextResponse.json(
      { error: `Failed to create nonce: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}



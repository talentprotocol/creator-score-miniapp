import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!process.env.NEYNAR_API_KEY) {
    console.error("NEYNAR_API_KEY is not set in environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const neynarClient = new NeynarAPIClient({
    apiKey: process.env.NEYNAR_API_KEY,
  });

  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  try {
    const user = await neynarClient.fetchBulkUsers({ fids: [Number(fid)] });
    if (!user?.users?.[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = user.users[0];
    const addresses = userData.verifications || [];
    const primaryEthAddress = userData.verified_addresses?.primary?.eth_address;
    const primarySolAddress = userData.verified_addresses?.primary?.sol_address;

    return NextResponse.json({
      addresses,
      primaryEthAddress,
      primarySolAddress,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 },
    );
  }
}

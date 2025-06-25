import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!process.env.NEYNAR_API_KEY) {
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
  const wallet = searchParams.get("wallet");

  if (!fid && !wallet) {
    return NextResponse.json(
      { error: "FID or wallet is required" },
      { status: 400 },
    );
  }

  if (fid) {
    try {
      let user;
      let attempts = 0;
      let lastError;
      while (attempts < 2) {
        try {
          user = await neynarClient.fetchBulkUsers({ fids: [Number(fid)] });
          break;
        } catch (err) {
          lastError = err;
          attempts++;
        }
      }
      if (!user?.users?.[0]) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const userData = user.users[0];
      const addresses = userData.verifications || [];
      const primaryEthAddress =
        userData.verified_addresses?.primary?.eth_address;
      const primarySolAddress =
        userData.verified_addresses?.primary?.sol_address;
      return NextResponse.json({
        addresses,
        primaryEthAddress,
        primarySolAddress,
      });
    } catch (err) {
      console.error("Failed to fetch user data from Neynar:", err);
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 },
      );
    }
  }

  // Wallet address fallback (mock/echo for now)
  if (wallet) {
    // In a real implementation, you would look up wallet verifications here
    // For now, just return the wallet as the only address
    return NextResponse.json({
      addresses: [wallet],
      primaryEthAddress: wallet,
      primarySolAddress: null,
    });
  }
}

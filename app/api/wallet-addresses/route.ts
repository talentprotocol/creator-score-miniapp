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
    console.log("Fetching user data for FID:", fid);

    // Using the correct method name from the SDK
    const user = await neynarClient.fetchBulkUsers({ fids: [Number(fid)] });
    console.log("Neynar API response:", JSON.stringify(user, null, 2));

    if (!user?.users?.[0]) {
      console.log("User not found in response");
      return NextResponse.json(
        { addresses: [], error: "User not found" },
        { status: 404 },
      );
    }

    const userData = user.users[0];
    const addresses = userData.verifications || [];
    const custodyAddress = userData.custody_address;
    const primaryEthAddress = userData.verified_addresses?.primary?.eth_address;
    const primarySolAddress = userData.verified_addresses?.primary?.sol_address;

    console.log("Found addresses:", {
      verifications: addresses,
      custodyAddress,
      primaryEthAddress,
      primarySolAddress,
    });

    return NextResponse.json({
      addresses,
      custodyAddress,
      primaryEthAddress,
      primarySolAddress,
    });
  } catch (error) {
    console.error("Detailed error in wallet-addresses API:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        addresses: [],
        error:
          error instanceof Error
            ? `API Error: ${error.message}`
            : "Failed to fetch wallet addresses",
      },
      { status: 500 },
    );
  }
}

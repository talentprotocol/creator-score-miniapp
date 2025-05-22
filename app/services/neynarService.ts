import { NeynarAPIClient } from "@neynar/nodejs-sdk";

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY is not set in environment variables");
}

const neynarClient = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY,
});

export interface UserWalletAddresses {
  addresses: string[];
  error?: string;
}

/**
 * Fetches all wallet addresses associated with a Farcaster FID
 * @param fid The Farcaster ID to fetch wallet addresses for
 * @returns Promise<UserWalletAddresses> Object containing array of addresses or error
 */
export async function getUserWalletAddresses(
  fid: number,
): Promise<UserWalletAddresses> {
  try {
    // @ts-ignore - SDK types are out of sync with implementation
    const user = await neynarClient.fetchUserByFid(fid);

    if (!user?.result?.user) {
      return {
        addresses: [],
        error: "User not found",
      };
    }

    // Get all verified addresses from the user's verifications
    const addresses = user.result.user.verifications || [];

    return {
      addresses,
    };
  } catch (error) {
    console.error("Error fetching user wallet addresses:", error);
    return {
      addresses: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch wallet addresses",
    };
  }
}

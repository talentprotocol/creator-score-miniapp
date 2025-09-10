import { getNeynarClient } from "@/lib/neynar-client";
import type { UserWalletAddresses } from "@/lib/types";

/**
 * Fetches all wallet addresses associated with a Farcaster FID
 * @param fid The Farcaster ID to fetch wallet addresses for
 * @returns Promise<UserWalletAddresses> Object containing array of addresses or error
 */
export async function getUserWalletAddresses(
  fid: number,
): Promise<UserWalletAddresses> {
  try {
    const neynarClient = getNeynarClient();
    const data = await neynarClient.getWalletAddressesRaw(fid);

    return {
      addresses: data.addresses,
      custodyAddress: data.custodyAddress || "",
      primaryEthAddress: data.primaryEthAddress,
      primarySolAddress: data.primarySolAddress,
    };
  } catch (error) {
    console.error("Error fetching user wallet addresses:", error);
    return {
      addresses: [],
      custodyAddress: "",
      primaryEthAddress: null,
      primarySolAddress: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch wallet addresses",
    };
  }
}

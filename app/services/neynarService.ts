export interface UserWalletAddresses {
  addresses: string[];
  custodyAddress: string;
  primaryEthAddress: string | null;
  primarySolAddress: string | null;
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
    const response = await fetch(`/api/wallet-addresses?fid=${fid}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        addresses: [],
        custodyAddress: "",
        primaryEthAddress: null,
        primarySolAddress: null,
        error: data.error || "Failed to fetch wallet addresses",
      };
    }

    return data;
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

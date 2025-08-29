import type {
  WalletAccount,
  GroupedWalletAccounts,
  WalletAccountsResponse,
} from "./types";

/**
 * Fetches wallet accounts for a given Talent Protocol ID and groups them by verification source
 * This service is called from server-side API routes only
 */
export async function getWalletAccountsForTalentId(
  talentId: string | number,
): Promise<GroupedWalletAccounts> {
  try {
    // Server-side: call Talent API directly
    const { talentApiClient } = await import("@/lib/talent-api-client");

    const response = await talentApiClient.getAccounts({
      id: String(talentId),
    });

    if (!response.ok) {
      throw new Error(`Talent API error: ${response.status}`);
    }

    const data: WalletAccountsResponse = await response.json();

    // Filter only wallet accounts and group by verification source
    const walletAccounts = data.accounts.filter(
      (account: WalletAccount) => account.source === "wallet",
    );

    const farcasterVerified = walletAccounts.filter(
      (account: WalletAccount) => account.imported_from === "farcaster",
    );

    const talentVerified = walletAccounts.filter(
      (account: WalletAccount) => account.imported_from === null,
    );

    return {
      farcasterVerified,
      talentVerified,
    };
  } catch (error) {
    console.error("Error fetching wallet accounts:", error);
    return {
      farcasterVerified: [],
      talentVerified: [],
    };
  }
}

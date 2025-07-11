import type {
  WalletAccount,
  GroupedWalletAccounts,
  WalletAccountsResponse,
} from "./types";
import { getLocalBaseUrl } from "@/lib/constants";

/**
 * Fetches wallet accounts for a given Talent Protocol ID and groups them by verification source
 */
export async function getWalletAccountsForTalentId(
  talentId: string | number,
): Promise<GroupedWalletAccounts> {
  try {
    let baseUrl = "";
    if (typeof window === "undefined") {
      baseUrl = process.env.NEXT_PUBLIC_URL || getLocalBaseUrl();
    }

    const response = await fetch(
      `${baseUrl}/api/talent-accounts?id=${talentId}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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

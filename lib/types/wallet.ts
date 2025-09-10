/**
 * Wallet-related types
 */

export interface UserWalletAddresses {
  addresses: string[];
  custodyAddress: string;
  primaryEthAddress: string | null;
  primarySolAddress: string | null;
  error?: string;
}

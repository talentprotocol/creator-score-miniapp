// Profile response types with new primary wallet fields
export interface ProfileResponse {
  id: string;
  fid: number | null;
  wallet: string | null;
  github: string | null;
  fname: string | null;
  display_name: string | null;
  image_url: string | null;
  main_wallet_address: string | null;
  farcaster_primary_wallet_address: string | null;
  [key: string]: unknown;
}

// Unified user profile returned by userProfileService
export interface UnifiedUserProfile {
  talentUuid: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  creatorScore: number;
  lastCalculatedAt: string | null;
  calculating: boolean;
  hasTalentAccount: boolean;
  error?: string;
}

// Wallet account types for Talent Protocol API
export interface WalletAccount {
  identifier: string; // wallet address
  imported_from: string | null;
  connected_at: string;
  owned_since: string | null;
  source: string;
  username: string | null;
  invalid_token: boolean;
}

export interface GroupedWalletAccounts {
  farcasterVerified: WalletAccount[]; // imported_from = "farcaster"
  talentVerified: WalletAccount[]; // imported_from = null
}

export interface WalletAccountsResponse {
  accounts: WalletAccount[];
}

// Settings page types
export interface ConnectedAccount {
  identifier: string; // username, handle, or address
  source: string; // "github", "twitter", "wallet", etc.
  username: string | null;
  handle: string | null;
  connected_at: string;
  owned_since: string | null;
  imported_from: string | null;
  invalid_token: boolean;
  is_primary?: boolean; // For wallet accounts
  is_public?: boolean; // For wallet accounts
  is_enabled?: boolean; // For wallet accounts
  profile_url?: string | null;
  image_url?: string | null;
}

export interface ConnectedAccountsResponse {
  accounts: ConnectedAccount[];
}

export interface GroupedConnectedAccounts {
  social: ConnectedAccount[]; // GitHub, Twitter, etc.
  wallet: ConnectedAccount[]; // Wallet addresses
  primaryWalletInfo?: {
    main_wallet_address: string | null;
    farcaster_primary_wallet_address: string | null;
  };
}

// Settings specific types
export interface UserSettings {
  email: string | null;
  emailConfirmed?: boolean | null;
  notifications: {
    farcaster: boolean;
    email: boolean;
  };
}

export interface AccountManagementAction {
  action:
    | "connect"
    | "disconnect"
    | "set_primary"
    | "update_email"
    | "delete_account";
  account_type?: "github" | "twitter" | "linkedin" | "wallet";
  identifier?: string;
  data?: Record<string, unknown>;
}

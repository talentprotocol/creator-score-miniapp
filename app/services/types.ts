export interface BuilderScore {
  score: number;
  level: number;
  levelName: string;
  lastCalculatedAt: string | null;
  walletAddress: string | null;
  calculating?: boolean;
  calculatingEnqueuedAt?: string | null;
  error?: string;
}

export type CreatorScore = BuilderScore; // They share the same structure

export interface SocialAccount {
  source: string;
  handle: string | null;
  followerCount: number | null;
  accountAge: string | null;
  profileUrl?: string | null;
  imageUrl?: string | null;
  displayName?: string | null; // For UI display (e.g., 'GitHub')
}

export interface Credential {
  data_issuer_name: string;
  name: string;
  points: number;
  max_score: number;
  description: string;
  external_url: string | null;
  last_calculated_at: string | null;
  category: string;
  data_issuer_slug: string;
  slug: string;
  uom: string;
  readable_value: string | null;
  points_calculation_logic?: {
    data_points?: Array<{
      is_maximum: boolean;
      readable_value: string | null;
      value: string | null;
      uom: string | null;
    }>;
    max_points: number | null;
  };
}

export interface CredentialsResponse {
  credentials: Credential[];
}

export interface IssuerCredentialGroup {
  issuer: string;
  total: number;
  max_total: number;
  points: Array<{
    label: string;
    slug?: string; // Optional slug for matching with API
    value: number;
    max_score: number | null;
    readable_value: string | null;
    uom: string | null;
    external_url: string | null;
  }>;
}

export interface TalentSocialAccount {
  source: string;
  handle: string | null;
  followers_count: number | null;
  owned_since: string | null;
  profile_url: string | null;
  image_url: string | null;
}

export interface Post {
  chain: string;
  name: string; // Title of the content
  platform: string; // Platform name (e.g., "paragraph")
  onchain_created_at: string; // ISO date string
  url: string; // Original post URL
  description: string;
  image_url: string;
  metadata: {
    symbol: string;
    post_id: string;
    block_number: number;
    transaction_hash: string;
  };
  onchain_address: string;
  owner_address: string;
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    current_page: number;
    last_page: number;
  };
}

export type LeaderboardEntry = {
  rank: number;
  name: string;
  pfp?: string;
  score: number;
  rewards: string;
  id: string;
  talent_protocol_id: string | number;
  // Token boost fields
  tokenBalance?: number;
  isBoosted?: boolean;
  boostAmount?: number;
  baseReward?: number;
  boostedReward?: number;
};

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

// Scorer slugs from Talent Protocol API
export const SCORER_SLUGS = {
  BUILDER: "builder_score", // default scorer
  CREATOR: "creator_score",
} as const;

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
  account_type?: "github" | "twitter" | "wallet";
  identifier?: string;
  data?: Record<string, unknown>;
}

// Proof of Humanity types
export interface HumanityCredential {
  account_source: string;
  calculating_score: boolean;
  category: string;
  data_issuer_name: string;
  data_issuer_slug: string;
  description: string;
  external_url: string;
  immutable: boolean;
  last_calculated_at: string | null;
  max_score: number;
  name: string;
  points: number;
  points_calculation_logic: Record<string, unknown>;
  slug: string;
  uom: string;
  updated_at: string | null;
}

export interface HumanityCredentialsResponse {
  credentials: HumanityCredential[];
}

// Search types
export interface SearchProfile {
  id: string;
  name: string;
  display_name?: string;
  image_url?: string;
  score?: number;
  accounts?: Array<{
    source: string;
    identifier: string;
    username?: string;
    followers_count?: number;
  }>;
}

export interface SearchResponse {
  profiles: SearchProfile[];
  pagination?: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
}

export interface SearchResult {
  id: string;
  name: string;
  avatarUrl?: string;
  score: number;
}

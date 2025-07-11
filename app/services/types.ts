export interface BuilderScore {
  score: number;
  level: number;
  levelName: string;
  lastCalculatedAt: string | null;
  walletAddress: string | null;
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

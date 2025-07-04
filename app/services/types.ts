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

export type LeaderboardEntry = {
  rank: number;
  name: string;
  pfp?: string;
  score: number;
  rewards: string;
  id: string;
  talent_protocol_id: string | number;
};

// Scorer slugs from Talent Protocol API
export const SCORER_SLUGS = {
  BUILDER: "builder_score", // default scorer
  CREATOR: "creator_score",
} as const;

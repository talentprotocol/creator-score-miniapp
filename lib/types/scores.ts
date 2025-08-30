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

// Scorer slugs from Talent Protocol API
export const SCORER_SLUGS = {
  BUILDER: "builder_score", // default scorer
  CREATOR: "creator_score",
} as const;

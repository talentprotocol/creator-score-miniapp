export interface BasecampProfile {
  talent_uuid: string;
  display_name: string;
  image_url: string | null;
  zora_creator_coin_address: string | null;
  zora_creator_coin_symbol: string | null;
  zora_creator_coin_market_cap: number | null;
  zora_creator_coin_market_cap_24h: number | null;
  zora_creator_coin_total_volume: number | null;
  zora_creator_coin_24h_volume: number | null;
  zora_creator_coin_unique_holders: number | null;
  zora_creator_coin_holders_24h_delta?: number; // Computed field
  creator_score: number | null;
  builder_score: number | null;
  total_earnings: number | null;
  rewards_amount: number | null;
  smart_contracts_deployed: number | null; // Smart contracts deployed from CSV
  total_collectors: number | null;
  total_followers: number | null;
  total_posts: number | null;
  base200_score: number;
  rank?: number; // Make optional - only used for mobile/pinned users
}

export interface BasecampStats {
  totalBuilderRewards: number;
  totalContractsDeployed: number;
  totalMarketCap: number;
  totalCreatorEarnings: number;
  calculationDate: string;
}

export type SortColumn =
  | "base200_score"
  | "creator_score"
  | "builder_score"
  | "total_earnings"
  | "rewards_amount"
  | "smart_contracts_deployed"
  | "total_collectors"
  | "total_followers"
  | "total_posts"
  | "zora_creator_coin_market_cap"
  | "zora_creator_coin_market_cap_24h"
  | "zora_creator_coin_total_volume"
  | "zora_creator_coin_24h_volume"
  | "zora_creator_coin_unique_holders";

export type SortOrder = "asc" | "desc";

export type BasecampTab = "coins" | "creator" | "builder";

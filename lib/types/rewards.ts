/**
 * Reward-related types for storage and token balance management
 */

export interface StoredRewardsData {
  rewards_amount: number | null;
  rewards_calculated_at: string | null;
}

export interface TokenBalanceData {
  balance: number;
  lastUpdated: string;
  isBoosted: boolean;
}

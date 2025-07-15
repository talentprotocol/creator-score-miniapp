// Configuration for which credentials count toward "Total Earnings" calculation
// Separates creator earnings from collector earnings and portfolio metrics

export interface TotalEarningsConfig {
  // Credentials that count as creator earnings (from creating content)
  creatorEarnings: string[];
  // Credentials that count as collector/curator earnings (from collecting/referring)
  collectorEarnings: string[];
  // Credentials that are portfolio metrics (don't count as earnings)
  portfolioMetrics: string[];
}

export const TOTAL_EARNINGS_CONFIG: TotalEarningsConfig = {
  // These credentials represent money earned by creating content (using slugs)
  creatorEarnings: [
    "mirror_creator_rewards",
    "warpcast_rewards_usdc", // Farcaster Creator Rewards
    "zora_creator_rewards",
    "zora_coin_earnings", // Coin Earnings from Zora
    "noice_tips_earnings",
    "coop_records_earnings", // Music Earnings from Coop Records
    "paragraph_creator_rewards", // Creator Rewards from Paragraph
    "pods_creator_rewards", // Creator Rewards from Pods
    "lens_total_earnings", // Total Earnings from Lens
    // Add other creator earnings credentials as they're discovered
  ],

  // These credentials represent money earned by collecting/curating content (using slugs)
  collectorEarnings: [
    "mirror_referral_rewards", // Earned by referring collectors, not creating
    // Add other collector earnings credentials as they're discovered
  ],

  // These are portfolio/activity metrics, not earnings (using slugs)
  portfolioMetrics: [
    "zora_total_volume", // Trading volume, not earnings
    "zora_market_cap", // Portfolio value, not earnings
    "onchain_eth_balance", // Current balance, not earnings
    "zora_unique_holders",
    "zora_unique_collectors",
    "mirror_unique_collectors",
    "farcaster_followers",
    "lens_followers",
    "efp_followers",
    "twitter_followers",
    "linkedin_followers",
    "stack_score",
    "talent_protocol_human_checkmark",
    "bonsai_airdrop",
    "kaito_airdrop_one",
    "zora_airdrop_one",
    "phi_artist_score",
    "ens_account_age",
    "farcaster_account_age",
    "lens_account_age",
    "twitter_account_age",
    "onchain_account_age",
    "onchain_out_transactions",
    "mirror_total_posts",
  ],
};

/**
 * Check if a credential should count toward Total Earnings (creator earnings only)
 * Now uses slugs for reliable identification
 */
export function isEarningsCredential(credentialSlug: string): boolean {
  return TOTAL_EARNINGS_CONFIG.creatorEarnings.includes(credentialSlug);
}

/**
 * Check if a credential is a creator earnings credential
 */
export function isCreatorEarningsCredential(credentialSlug: string): boolean {
  return TOTAL_EARNINGS_CONFIG.creatorEarnings.includes(credentialSlug);
}

/**
 * Check if a credential is a collector earnings credential
 */
export function isCollectorEarningsCredential(credentialSlug: string): boolean {
  return TOTAL_EARNINGS_CONFIG.collectorEarnings.includes(credentialSlug);
}

/**
 * Check if a credential is a portfolio metric (not earnings)
 */
export function isPortfolioMetric(credentialSlug: string): boolean {
  return TOTAL_EARNINGS_CONFIG.portfolioMetrics.includes(credentialSlug);
}

/**
 * Get all creator earnings credential slugs
 */
export function getCreatorEarningsCredentials(): string[] {
  return TOTAL_EARNINGS_CONFIG.creatorEarnings;
}

/**
 * Get all collector earnings credential slugs
 */
export function getCollectorEarningsCredentials(): string[] {
  return TOTAL_EARNINGS_CONFIG.collectorEarnings;
}

/**
 * Get all portfolio metric credential slugs
 */
export function getPortfolioMetricCredentials(): string[] {
  return TOTAL_EARNINGS_CONFIG.portfolioMetrics;
}

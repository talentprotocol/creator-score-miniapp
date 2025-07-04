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
  // These credentials represent money earned by creating content
  creatorEarnings: [
    "Mirror Creator Rewards",
    "Farcaster Creator Rewards",
    "Zora Creator Rewards",
    "Coin Earnings", // Zora coin earnings from their creations
    "Noice Tips Earnings",
    // Add other creator earnings credentials as they're discovered
  ],

  // These credentials represent money earned by collecting/curating content
  collectorEarnings: [
    "Mirror Referral Rewards", // Earned by referring collectors, not creating
    // Add other collector earnings credentials as they're discovered
  ],

  // These are portfolio/activity metrics, not earnings
  portfolioMetrics: [
    "Total Volume", // Trading volume, not earnings
    "Market Cap", // Portfolio value, not earnings
    "ETH Balance", // Current balance, not earnings
    "Unique Holders",
    "Unique Collectors",
    "Mirror Unique Collectors",
    "Farcaster Followers",
    "Lens Followers",
    "EFP Followers",
    "X Followers",
    "LinkedIn Followers",
    "Stack Score",
    "Human Checkmark",
    "Bonsai Airdrop 1",
    "Kaito Airdrop #1",
    "Zora Airdrop #1",
    "Phi Artist Score",
    "ENS Account Age",
    "Farcaster Account Age",
    "Lens Account Age",
    "X Account Age",
    "First Transaction",
    "Outgoing Transactions",
    "Mirror Total Posts",
  ],
};

/**
 * Check if a credential should count toward Total Earnings (creator earnings only)
 */
export function isEarningsCredential(credentialName: string): boolean {
  return TOTAL_EARNINGS_CONFIG.creatorEarnings.includes(credentialName);
}

/**
 * Check if a credential is a creator earnings credential
 */
export function isCreatorEarningsCredential(credentialName: string): boolean {
  return TOTAL_EARNINGS_CONFIG.creatorEarnings.includes(credentialName);
}

/**
 * Check if a credential is a collector earnings credential
 */
export function isCollectorEarningsCredential(credentialName: string): boolean {
  return TOTAL_EARNINGS_CONFIG.collectorEarnings.includes(credentialName);
}

/**
 * Check if a credential is a portfolio metric (not earnings)
 */
export function isPortfolioMetric(credentialName: string): boolean {
  return TOTAL_EARNINGS_CONFIG.portfolioMetrics.includes(credentialName);
}

/**
 * Get all creator earnings credential names
 */
export function getCreatorEarningsCredentials(): string[] {
  return TOTAL_EARNINGS_CONFIG.creatorEarnings;
}

/**
 * Get all collector earnings credential names
 */
export function getCollectorEarningsCredentials(): string[] {
  return TOTAL_EARNINGS_CONFIG.collectorEarnings;
}

/**
 * Get all portfolio metric credential names
 */
export function getPortfolioMetrics(): string[] {
  return TOTAL_EARNINGS_CONFIG.portfolioMetrics;
}

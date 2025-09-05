// Configuration for credential categorization in badge calculations
// Separates creator earnings, collector earnings, and collector counts

export interface TotalEarningsConfig {
  // Credentials that count as creator earnings (from creating content)
  creatorEarnings: string[];
  // Credentials that count as collector/curator earnings (from collecting/referring)
  collectorEarnings: string[];
  // Credentials that represent collector counts (for Total Collectors badge)
  collectorCounts: string[];
}

export const TOTAL_EARNINGS_CONFIG: TotalEarningsConfig = {
  // These credentials represent money earned by creating content (using slugs)
  creatorEarnings: [
    "mirror_creator_rewards",
    "mirror_creator_rewards_pol", // Mirror earnings on POL (converted to USD)
    "warpcast_rewards_usdc", // Farcaster Creator Rewards
    "zora_creator_rewards",
    "zora_coin_earnings", // Content Coin Earnings from Zora
    "noice_tips_earnings",
    "coop_records_earnings", // Music Earnings from Coop Records
    "paragraph_creator_rewards", // Creator Rewards from Paragraph
    "pods_creator_rewards", // Creator Rewards from Pods
    "lens_total_earnings", // Total Earnings from Lens
    "flaunch_earnings", // Flaunch creator earnings (USD)
    "zora_creator_coin_earnings", //new, doesn't exist in the api yet
    // Add other creator earnings credentials as they're discovered
  ],

  // These credentials represent money earned by collecting/curating content (using slugs)
  collectorEarnings: [
    "mirror_referral_rewards", // Earned by referring collectors, not creating
    "zora_referral_rewards", // Zora referral rewards
    // Add other collector earnings credentials as they're discovered
  ],

  // These credentials represent collector counts (for Total Collectors badge)
  collectorCounts: [
    "coop_records_holders",
    "mirror_unique_collectors",
    "opensea_nft_total_owners",
    "paragraph_unique_collectors", // currently not working
    "zora_unique_holders",
    "nft_holders", // also includes mirror and paragraph
    "zora_creator_coin_unique_holders", //new, doesn't exist in the api yet
  ],
};

/**
 * Check if a credential should count toward Total Earnings (creator earnings only)
 * Uses whitelist approach: only credentials in creatorEarnings count as earnings
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
 * Get all collector count credential slugs (for Total Collectors badge)
 */
export function getCollectorCountCredentials(): string[] {
  return TOTAL_EARNINGS_CONFIG.collectorCounts;
}

// Platform display name mappings for collector count credentials
export const PLATFORM_NAME_MAPPINGS: Record<string, string> = {
  coop_records_holders: "Coop Records",
  mirror_unique_collectors: "Mirror",
  opensea_nft_total_owners: "NFTs (includes Paragraph)",
  paragraph_unique_collectors: "Paragraph",
  zora_unique_holders: "Zora",
};

/**
 * Get the display name for a credential slug
 */
export function getPlatformDisplayName(credentialSlug: string): string {
  return PLATFORM_NAME_MAPPINGS[credentialSlug] || credentialSlug;
}

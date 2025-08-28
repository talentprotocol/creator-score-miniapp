import { revalidateTag } from "next/cache";

export const CACHE_KEYS = {
  LEADERBOARD_TOP_200: "leaderboard-top-200",
  LEADERBOARD_BASIC: "leaderboard-basic",
  LEADERBOARD: "leaderboard",
  BOOSTED_PROFILES: "boosted-profiles",
  PROFILE_SEARCH: "profile-search",
  SHARE_IMAGE_DATA: "share-image-data",
  CREATOR_SCORES: "creator-scores",
  SOCIAL_ACCOUNTS: "social-accounts",
  CREDENTIALS: "credentials",
  POSTS: "posts",
  TALENT_PROFILES: "talent-profiles",
  // Add missing cache keys
  USER_PROFILE: "user-profile",
  USER_TOKEN_BALANCE: "user-token-balance",
  PROFILE_HEADER: "profile-header",
  PROFILE_CREDENTIALS: "profile-credentials",
  PROFILE_POSTS: "profile-posts",
  PROFILE_POSTS_PAGINATED: "profile-posts-paginated",
  PROFILE_SOCIAL_ACCOUNTS: "profile-social-accounts",
  PROFILE_WALLET_ACCOUNTS: "profile-wallet-accounts",
  PROFILE_POSTS_ALL: "profile-posts-all",
  USER_CREATOR_SCORE: "user-creator-score",
  CONNECTED_ACCOUNTS: "connected-accounts",
  USER_SETTINGS: "user-settings",
  HUMANITY_CREDENTIALS: "humanity-credentials",
  TOTAL_EARNINGS: "total-earnings",
  EARNINGS_BREAKDOWN: "earnings-breakdown",
  ETH_USDC_PRICE: "eth-usdc-price",
  FID_TO_TALENT_UUID: "fid-to-talent-uuid",
};

export const CACHE_DURATION_1_SECOND = 1; // 1 second
export const CACHE_DURATION_1_MINUTE = 60; // 1 minute
export const CACHE_DURATION_5_MINUTES = 300; // 5 minutes
export const CACHE_DURATION_10_MINUTES = 600; // 10 minutes
export const CACHE_DURATION_30_MINUTES = 1800; // 30 minutes
export const CACHE_DURATION_1_HOUR = 3600; // 1 hour
export const CACHE_DURATION_1_DAY = 86400; // 1 day
export const CACHE_DURATION_1_WEEK = 604800; // 1 week
export const CACHE_DURATION_1_MONTH = 2592000; // 1 month
export const CACHE_DURATION_1_YEAR = 31536000; // 1 year

/**
 * Clear cache for a specific user's data
 */
export async function clearUserCache(talentUuid: string): Promise<void> {
  // Clear server-side cache
  revalidateTag(`${CACHE_KEYS.CREDENTIALS}-${talentUuid}`);
  revalidateTag(CACHE_KEYS.CREDENTIALS);
  revalidateTag(`${CACHE_KEYS.USER_PROFILE}-${talentUuid}`);
  revalidateTag(CACHE_KEYS.USER_PROFILE);

  // Clear client-side cache if in browser
  if (typeof window !== "undefined") {
    const cacheKeys = [
      `${CACHE_KEYS.PROFILE_CREDENTIALS}_${talentUuid}`,
      `${CACHE_KEYS.CONNECTED_ACCOUNTS}_${talentUuid}`,
      `${CACHE_KEYS.USER_SETTINGS}_${talentUuid}`,
      `${CACHE_KEYS.HUMANITY_CREDENTIALS}_${talentUuid}`,
      `${CACHE_KEYS.PROFILE_POSTS}_${talentUuid}`,
      `${CACHE_KEYS.PROFILE_SOCIAL_ACCOUNTS}_${talentUuid}`,
      `${CACHE_KEYS.PROFILE_WALLET_ACCOUNTS}_${talentUuid}`,
      `${CACHE_KEYS.TOTAL_EARNINGS}_${talentUuid}`,
      `${CACHE_KEYS.EARNINGS_BREAKDOWN}_${talentUuid}`,
    ];

    cacheKeys.forEach((key) => {
      // Remove both with and without cache: prefix
      localStorage.removeItem(key);
      localStorage.removeItem(`cache:${key}`);
    });
  }
}

/**
 * Clear all caches (admin function)
 */
export async function clearAllCaches(): Promise<void> {
  Object.values(CACHE_KEYS).forEach((tag) => {
    revalidateTag(tag);
  });
}

/**
 * Clear specific cache types for a user
 */
export function clearUserCredentialsCache(talentUuid: string): void {
  if (typeof window !== "undefined") {
    const credentialCacheKeys = [
      `${CACHE_KEYS.PROFILE_CREDENTIALS}_${talentUuid}`,
    ];

    credentialCacheKeys.forEach((key) => {
      localStorage.removeItem(key);
      localStorage.removeItem(`cache:${key}`);
    });
  }
}

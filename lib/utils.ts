import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { unstable_cache } from "next/cache";
import { isEarningsCredential } from "./total-earnings-config";
import { LEVEL_RANGES } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function filterEthAddresses(
  addresses: (string | undefined | null)[],
): string[] {
  return addresses.filter(
    (addr): addr is string =>
      typeof addr === "string" &&
      addr.startsWith("0x") &&
      addr.length === 42 &&
      /^0x[a-fA-F0-9]{40}$/.test(addr),
  );
}

export function calculateScoreProgress(score: number, level: number) {
  if (!score || !level) return 0;
  const currentLevel = LEVEL_RANGES[level - 1];
  const nextLevel = LEVEL_RANGES[level];
  if (!nextLevel || score >= nextLevel.min) return 100;
  const range = nextLevel.min - currentLevel.min;
  const progress = score - currentLevel.min;
  return (progress / range) * 100;
}

export function calculatePointsToNextLevel(score: number, level: number) {
  if (!score || !level) return null;
  const nextLevel = LEVEL_RANGES[level];
  if (!nextLevel || score >= nextLevel.min) return null;
  return nextLevel.min - score;
}

/**
 * Convert a raw Creator Score into a level number based on LEVEL_RANGES
 */
export function getLevelFromScore(score: number): number {
  if (typeof score !== "number" || isNaN(score) || score < 0) return 1;
  const levelInfo =
    LEVEL_RANGES.find((range) => score >= range.min && score <= range.max) ||
    LEVEL_RANGES[0];
  return LEVEL_RANGES.indexOf(levelInfo) + 1;
}

export function getLevelBadgeColor(level: number | null): string {
  if (!level) return "bg-gray-500";

  switch (level) {
    case 1:
      return "bg-gray-500";
    case 2:
      return "bg-blue-500";
    case 3:
      return "bg-yellow-500";
    case 4:
      return "bg-purple-500";
    case 5:
      return "bg-green-500";
    case 6:
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

export async function getEthUsdcPrice(): Promise<number> {
  const cacheKey = "eth_usdc_price";

  // Check cache first
  const cachedPrice = getCachedData<number>(
    cacheKey,
    CACHE_DURATIONS.ETH_PRICE,
  );
  if (cachedPrice !== null && cachedPrice !== undefined) {
    return cachedPrice;
  }

  try {
    const response = await fetch(
      "https://api.coinbase.com/v2/prices/ETH-USD/spot",
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const price = parseFloat(data.data?.amount);

    if (isNaN(price) || price <= 0) {
      throw new Error("Invalid price data");
    }

    // Cache the price with correct 24-hour duration
    setCachedData(cacheKey, price);

    return price;
  } catch {
    // Return fallback price if fetch fails
    return 3000;
  }
}

export function convertEthToUsdc(ethAmount: number, ethPrice: number): number {
  return ethAmount * ethPrice;
}

// POL (Polygon) price in USD using Coinbase MATIC-USD spot
export async function getPolUsdPrice(): Promise<number> {
  const cacheKey = "pol_usd_price";

  const cachedPrice = getCachedData<number>(
    cacheKey,
    CACHE_DURATIONS.ETH_PRICE,
  );
  if (cachedPrice !== null && cachedPrice !== undefined) {
    return cachedPrice;
  }

  try {
    const response = await fetch(
      "https://api.coinbase.com/v2/prices/MATIC-USD/spot",
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const price = parseFloat(data.data?.amount);
    if (isNaN(price) || price <= 0) {
      throw new Error("Invalid price data");
    }
    setCachedData(cacheKey, price);
    return price;
  } catch {
    // Conservative fallback
    return 1; // $1 per POL fallback to avoid exploding totals
  }
}

export function convertPolToUsdc(polAmount: number, polPrice: number): number {
  return polAmount * polPrice;
}

/**
 * Smart number formatter that intelligently handles decimal precision
 * - 1-digit K/M/B: Always show 2 decimals (5.00K, 5.53K)
 * - 2+ digit K/M/B: Show max 1 decimal (15K, 15.5K, 15.53K)
 * - Rounds .5 and above up, below .5 down
 * - Removes trailing zeros
 */
export function formatNumberSmart(num: number): string {
  // Handle invalid numbers
  if (isNaN(num) || !isFinite(num)) {
    return "—";
  }

  // Handle negative numbers
  if (num < 0) {
    return "—";
  }

  // Handle exactly 0
  if (num === 0) {
    return "0";
  }

  // Billions
  if (num >= 1_000_000_000) {
    const billions = num / 1_000_000_000;
    if (billions < 10) {
      // 1-digit B: always show 2 decimals
      return `${billions.toFixed(2)}B`;
    } else {
      // 2+ digit B: show max 1 decimal
      const rounded = Math.round(billions * 10) / 10;
      return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}B`;
    }
  }

  // Millions
  if (num >= 1_000_000) {
    const millions = num / 1_000_000;
    if (millions < 10) {
      // 1-digit M: always show 2 decimals
      return `${millions.toFixed(2)}M`;
    } else {
      // 2+ digit M: show max 1 decimal
      const rounded = Math.round(millions * 10) / 10;
      return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}M`;
    }
  }

  // Thousands
  if (num >= 10_000) {
    const thousands = num / 1_000;
    if (thousands < 10) {
      // 1-digit K: always show 2 decimals
      return `${thousands.toFixed(2)}K`;
    } else {
      // 2+ digit K: show max 1 decimal
      const rounded = Math.round(thousands * 10) / 10;
      return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}K`;
    }
  }

  // For numbers under 10,000, round to nearest integer
  const rounded = Math.round(num);
  // Add comma only for 4-digit numbers
  return rounded >= 1000 ? rounded.toLocaleString() : `${rounded}`;
}

export function formatNumberWithSuffix(num: number): string {
  // Handle invalid numbers - return error indicator instead of $0
  if (isNaN(num) || !isFinite(num)) {
    return "—";
  }

  // Handle negative numbers (shouldn't happen for earnings but just in case)
  if (num < 0) {
    return "—";
  }

  // Handle legitimate $0 (user has earned exactly $0)
  if (num === 0) {
    return "$0";
  }

  // Use the new smart formatter and add $ prefix
  return `$${formatNumberSmart(num)}`;
}

/**
 * Calculate total earnings from credentials by summing up creator earnings
 * and converting ETH to USDC using current market price.
 *
 * UPDATED: Now follows project rule to ignore points_calculation_logic
 * and uses only top-level credential fields (slug, readable_value, uom).
 *
 * FIXED: Previously had a data structure mismatch where currency detection
 * was checking readable_value (e.g., "2.67") for "ETH" instead of the
 * original value field (e.g., "1.6341052597675584 ETH"). Now correctly uses:
 * - readable_value for clean numeric amount
 * - uom field for currency detection
 *
 * UPDATED: Now uses credential slugs instead of names for reliable earnings
 * detection, preventing issues with display name variations.
 */
export async function calculateTotalRewards(
  credentials: Array<{
    slug?: string;
    readable_value: string | null;
    uom: string | null;
  }>,
  getEthUsdcPriceFn: () => Promise<number>,
): Promise<number> {
  const ethPrice = await getEthUsdcPriceFn();

  // Sum up all rewards, converting ETH to USDC
  const total = credentials.reduce((sum, credential) => {
    // Only count credentials that are creator earnings - use slug for reliable identification
    const isEarnings = isEarningsCredential(credential.slug || "");
    if (!isEarnings) {
      return sum;
    }

    if (!credential.readable_value) {
      return sum;
    }

    // Use the existing parseFormattedNumber utility for consistent parsing
    const value = parseFormattedNumber(credential.readable_value);
    if (isNaN(value)) {
      return sum;
    }

    let contribution = 0;
    const uom = credential.uom || "";

    // Handle different UOMs (ETH, USDC, USD)
    if (uom === "ETH") {
      contribution = convertEthToUsdc(value, ethPrice);
    } else if (uom === "USDC" || uom === "USD") {
      contribution = value;
    } else {
      // For unknown UOMs, assume USD
      contribution = value;
    }

    return sum + contribution;
  }, 0);

  return total;
}

export function formatRewardValue(num: number): string {
  return formatNumberWithSuffix(num);
}

export function truncateAddress(addr: string): string {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export function shouldShowUom(uom: string | null): boolean {
  if (!uom) return false;
  const hiddenUoms = [
    "creation date",
    "out transactions",
    "followers",
    "stack points",
  ];
  return !hiddenUoms.includes(uom);
}

export function formatReadableValue(
  value: string | null,
  uom: string | null = null,
): string {
  if (!value) return "";

  // If it's already a non-numeric descriptive value, return as is
  if (/[a-zA-Z]/.test(value) && !/^[0-9.]+$/.test(value)) {
    // For account age credentials we want to keep human text like "2 years"
    if (uom === "creation date") {
      return value;
    }
    return value;
  }

  // Extract numeric value from strings like "2.23K", "1.5M", etc.
  let num: number;
  let hasSuffix = false;

  if (value.includes("K")) {
    num = parseFloat(value.replace("K", "")) * 1000;
    hasSuffix = true;
  } else if (value.includes("M")) {
    num = parseFloat(value.replace("M", "")) * 1000000;
    hasSuffix = true;
  } else if (value.includes("B")) {
    num = parseFloat(value.replace("B", "")) * 1000000000;
    hasSuffix = true;
  } else {
    num = parseFloat(value);
  }

  if (isNaN(num)) return value;

  // Special handling for ETH values - always show Ξ symbol
  if (uom === "ETH") {
    if (hasSuffix) {
      // If the original value had a suffix, preserve the compact format
      if (num >= 1000000000) return `Ξ${(num / 1000000000).toFixed(1)}B`;
      if (num >= 1000000) return `Ξ${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `Ξ${(num / 1000).toFixed(1)}K`;
      return `Ξ${num.toFixed(3)}`;
    } else {
      // Original value was just a number, use standard ETH formatting
      return `Ξ${num.toFixed(3)}`;
    }
  }

  // Currency: USDC/USD
  if (uom === "USDC" || uom === "USD") {
    // Use consistent logic with the smart formatter
    if (num >= 1_000_000_000) {
      const billions = num / 1_000_000_000;
      if (billions < 10) {
        return `$${billions.toFixed(2)}B`;
      } else {
        const rounded = Math.round(billions * 10) / 10;
        return `$${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}B`;
      }
    }
    if (num >= 1_000_000) {
      const millions = num / 1_000_000;
      if (millions < 10) {
        return `$${millions.toFixed(2)}M`;
      } else {
        const rounded = Math.round(millions * 10) / 10;
        return `$${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}M`;
      }
    }
    if (num >= 10_000) {
      const thousands = num / 1_000;
      if (thousands < 10) {
        return `$${thousands.toFixed(2)}K`;
      } else {
        const rounded = Math.round(thousands * 10) / 10;
        return `$${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}K`;
      }
    }
    return Number.isInteger(num) ? `$${num.toFixed(0)}` : `$${num.toFixed(1)}`;
  }

  // Count-like units: display as integer with compact K when large
  const COUNT_UOMS = new Set([
    "followers",
    "collectors",
    "subscribers",
    "out transactions",
    "posts",
    "NFT",
    "repositories",
    "commits",
    "stars",
    "score",
    "points",
  ]);
  if (uom && COUNT_UOMS.has(uom)) {
    if (num >= 1000) {
      const thousands = num / 1000;
      if (thousands < 10) {
        return `${thousands.toFixed(2)}K`;
      } else {
        const rounded = Math.round(thousands * 10) / 10;
        return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}K`;
      }
    }
    return Math.round(num).toString();
  }

  // Token-like units (e.g., $TALENT, $KAITO, $WCT)
  if (uom && uom.startsWith("$")) {
    if (num >= 1000) {
      const thousands = num / 1000;
      if (thousands < 10) {
        return `${thousands.toFixed(2)}K`;
      } else {
        const rounded = Math.round(thousands * 10) / 10;
        return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}K`;
      }
    }
    return num >= 1 ? num.toFixed(2) : num.toFixed(3);
  }

  // Generic numeric formatting
  if (num >= 1000) {
    const thousands = num / 1000;
    if (thousands < 10) {
      return `${thousands.toFixed(2)}K`;
    } else {
      const rounded = Math.round(thousands * 10) / 10;
      return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}K`;
    }
  }
  // For small generic numbers, trim excessive precision
  return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
}

export function cleanCredentialLabel(label: string, issuer: string): string {
  // Remove the issuer name from the beginning of the label if it exists
  const issuerPrefix = `${issuer} `;
  return label.startsWith(issuerPrefix)
    ? label.slice(issuerPrefix.length)
    : label;
}

// Cache data structure for localStorage
interface CachedData<T> {
  data: T;
  timestamp: number;
}

export function getCachedData<T>(key: string, maxAgeMs: number): T | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const parsed: CachedData<T> = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;

    if (age > maxAgeMs) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const cacheData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch {
    // Storage quota exceeded or other error, silently fail
  }
}

// Unstable cache wrapper for specific data fetching functions
export function createCachedFunction<TArgs extends readonly unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  keyPrefix: string,
  revalidateSeconds: number,
) {
  return unstable_cache(fn, [keyPrefix], {
    revalidate: revalidateSeconds,
  });
}

// Helper to convert milliseconds to seconds for unstable_cache
export function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

// Cache duration constants
export const CACHE_DURATIONS = {
  PROFILE_DATA: 5 * 60 * 1000, // 5 minutes
  SOCIAL_ACCOUNTS: 60 * 60 * 1000, // 1 hour
  POSTS_DATA: 30 * 60 * 1000, // 30 minutes
  CREDENTIALS_DATA: 30 * 60 * 1000, // 30 minutes
  SCORE_BREAKDOWN: 30 * 60 * 1000, // 30 minutes (until profile updates)
  EXPENSIVE_COMPUTATION: 30 * 60 * 1000, // 30 minutes for expensive computations
  ETH_PRICE: 24 * 60 * 60 * 1000, // 24 hours
  LEADERBOARD_DATA: 5 * 60 * 1000, // 5 minutes for leaderboard data
} as const;

export { resolveTalentUser } from "./user-resolver";

/**
 * Generate profile URL from user data
 */
export function generateProfileUrl(params: {
  farcasterHandle?: string | null;
  talentId?: string | number | null;
}): string | null {
  const { farcasterHandle, talentId } = params;

  if (farcasterHandle) {
    return `/${farcasterHandle}`;
  }
  if (talentId) {
    return `/${talentId}`;
  }
  return null;
}

/**
 * Client environment types
 */
export type ClientEnvironment = "farcaster" | "base" | "browser";

/**
 * Detect the current client environment
 */
export async function detectClient(
  context?: unknown,
): Promise<ClientEnvironment> {
  // Check for Base App first - clientFid 399519 indicates Base app
  if (
    context &&
    typeof context === "object" &&
    "client" in context &&
    context.client &&
    typeof context.client === "object" &&
    "clientFid" in context.client &&
    context.client.clientFid === 399519
  ) {
    return "base";
  }

  // Use Farcaster SDK's own detection methods
  if (typeof window !== "undefined") {
    try {
      const { sdk } = await import("@farcaster/frame-sdk");

      // Check if Farcaster context is available using the SDK
      const farcasterContext = await sdk.context;
      if (farcasterContext && farcasterContext.client) {
        return "farcaster";
      }
    } catch {
      // SDK not available or failed to load, continue with fallback detection
    }

    // Fallback: Check for Farcaster-specific context properties
    if (
      context &&
      typeof context === "object" &&
      ("farcaster" in context ||
        "warpcast" in context ||
        "isFarcaster" in context)
    ) {
      return "farcaster";
    }
  }

  // Default to browser environment
  return "browser";
}

/**
 * Open external URL with environment detection
 */
export async function openExternalUrl(
  url: string,
  context?: unknown,
  appClient?: string | null,
): Promise<void> {
  const client = appClient || (await detectClient(context));

  if (client === "base") {
    try {
      // Use Base Mini App SDK - note: actual API methods need to be verified
      // For now, falling through to window.open as Base Mini App SDK methods are not confirmed
    } catch {
      // Fall through to regular window.open
    }
  } else if (client === "farcaster") {
    try {
      const { sdk } = await import("@farcaster/frame-sdk");
      await sdk.actions.openUrl(url);
      return;
    } catch {
      // Fall through to regular window.open
    }
  }

  // Regular browser environment - use window.open synchronously to avoid popup blockers
  try {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) {
      // Don't throw error - popups being blocked is expected behavior
      return;
    }
    // Focus the new window if it opened successfully
    newWindow.focus();
  } catch {
    // Don't throw error - this is expected in some environments
  }
}

/**
 * Compose a cast with environment detection
 */
export async function composeCast(
  farcasterText: string,
  twitterText: string,
  embeds?: string[],
  context?: unknown,
): Promise<void> {
  // First, detect the client environment
  const client = await detectClient(context);

  // Handle Farcaster environment
  if (client === "farcaster") {
    try {
      const { sdk } = await import("@farcaster/frame-sdk");

      // Farcaster SDK expects embeds as limited array
      const limitedEmbeds = embeds
        ? (embeds.slice(0, 2) as [] | [string] | [string, string])
        : undefined;

      await sdk.actions.composeCast({
        text: farcasterText,
        embeds: limitedEmbeds,
      });
      return;
    } catch {
      // Fall through to URL-based sharing
    }
  }

  // Handle Base app environment - use same composeCast as Farcaster
  if (client === "base") {
    try {
      const { sdk } = await import("@farcaster/frame-sdk");

      // Base app uses the same Farcaster SDK composeCast functionality
      const limitedEmbeds = embeds
        ? (embeds.slice(0, 2) as [] | [string] | [string, string])
        : undefined;

      await sdk.actions.composeCast({
        text: farcasterText,
        embeds: limitedEmbeds,
      });
      return;
    } catch {
      // Fall through to Twitter/X only if SDK fails
    }
  }

  // Fallback to Twitter/X for browser or when SDKs fail
  const encodedText = encodeURIComponent(twitterText);

  // Build Twitter/X share URL with URL parameter (for testing)
  let twitterUrl = `https://x.com/intent/post?text=${encodedText}`;

  if (embeds && embeds.length > 0) {
    // Add URL as parameter - Twitter should show as link preview
    const profileUrl = embeds[0];
    twitterUrl += `&url=${encodeURIComponent(profileUrl)}`;
  }

  window.open(twitterUrl, "_blank");
}

/**
 * Calculate total followers from social accounts
 */
export function calculateTotalFollowers(
  socialAccounts: Array<{ followerCount?: number | null }>,
): number {
  return socialAccounts.reduce((sum, acc) => sum + (acc.followerCount ?? 0), 0);
}

export function formatPostDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Helper to format numbers with K notation (2 decimals)
export function formatWithK(value: number): string {
  if (value >= 1000) {
    const thousands = value / 1000;
    if (thousands < 10) {
      return `${thousands.toFixed(2)}K`;
    } else {
      const rounded = Math.round(thousands * 10) / 10;
      return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}K`;
    }
  }
  return value.toString();
}

// Helper to format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Generic compact formatter without currency symbol (e.g., 2.09M, 3.01K, 780)
export function formatCompactNumber(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) return "—";
  if (amount < 0) return "—";
  if (amount === 0) return "0";

  // Use the new smart formatter for consistency
  return formatNumberSmart(amount);
}

// USD-specific compact formatter (kept for backward compatibility with existing usages)
export function formatCurrency(amount: number): string {
  const compact = formatCompactNumber(amount);
  if (compact === "—") return compact;
  return `$${compact}`;
}

// Token amount formatter (no currency symbol; pair with ticker like $TALENT)
export function formatTokenAmount(amount: number): string {
  return formatCompactNumber(amount);
}

/**
 * Parse formatted numbers with K and M suffixes
 * Examples: "3.01K" -> 3010, "1.5M" -> 1500000, "780" -> 780
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return 0;

  const trimmed = value.trim();

  // Handle K (thousands)
  if (trimmed.endsWith("K")) {
    const num = parseFloat(trimmed.slice(0, -1));
    return isNaN(num) ? 0 : num * 1000;
  }

  // Handle M (millions)
  if (trimmed.endsWith("M")) {
    const num = parseFloat(trimmed.slice(0, -1));
    return isNaN(num) ? 0 : num * 1000000;
  }

  // Handle regular numbers
  const num = parseFloat(trimmed);
  return isNaN(num) ? 0 : num;
}


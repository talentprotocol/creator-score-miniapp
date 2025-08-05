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
    setCachedData(cacheKey, price, CACHE_DURATIONS.ETH_PRICE);

    return price;
  } catch {
    // Return fallback price if fetch fails
    return 3000;
  }
}

export function convertEthToUsdc(ethAmount: number, ethPrice: number): number {
  return ethAmount * ethPrice;
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

  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 10_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  // For numbers under 10,000, round to nearest integer
  const rounded = Math.round(num);
  // Add comma only for 4-digit numbers
  return `$${rounded >= 1000 ? rounded.toLocaleString() : rounded}`;
}

/**
 * Calculate total earnings from credentials by summing up creator earnings
 * and converting ETH to USDC using current market price.
 *
 * FIXED: Previously had a data structure mismatch where currency detection
 * was checking readable_value (e.g., "2.67") for "ETH" instead of the
 * original value field (e.g., "1.6341052597675584 ETH"). Now correctly uses:
 * - readable_value for clean numeric amount
 * - original value field for currency detection
 *
 * UPDATED: Now uses credential slugs instead of names for reliable earnings
 * detection, preventing issues with display name variations.
 */
export async function calculateTotalRewards(
  credentials: Array<{
    name: string;
    slug?: string;
    points_calculation_logic?: {
      data_points: Array<{
        name?: string;
        value: string | null;
        readable_value: string | null;
        uom?: string | null;
      }>;
    };
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
    if (!credential.points_calculation_logic?.data_points) {
      return sum;
    }
    const credentialTotal =
      credential.points_calculation_logic.data_points.reduce(
        (acc, dataPoint) => {
          if (!dataPoint.readable_value && !dataPoint.value) {
            return acc;
          }
          const cleanValue = dataPoint.readable_value || dataPoint.value || "";
          const originalValue = dataPoint.value || "";
          let value: number;
          const numericValue = cleanValue.replace(/[^0-9.KM-]+/g, "");
          if (numericValue.includes("K")) {
            value = parseFloat(numericValue.replace("K", "")) * 1000;
          } else if (numericValue.includes("M")) {
            value = parseFloat(numericValue.replace("M", "")) * 1000000;
          } else {
            value = parseFloat(numericValue);
          }
          if (isNaN(value)) {
            return acc;
          }
          let contribution = 0;
          // This fixes the issue where readable_value (e.g., "2.67") was being checked for "ETH"
          // instead of the original value field (e.g., "1.6341052597675584 ETH")
          if (originalValue.includes("ETH")) {
            contribution = convertEthToUsdc(value, ethPrice);
          } else if (originalValue.includes("USDC")) {
            contribution = value;
          }
          return acc + contribution;
        },
        0,
      );
    return sum + credentialTotal;
  }, 0);

  return total;
}

export function formatRewardValue(num: number): string {
  return formatNumberWithSuffix(num);
}

// Profile-specific utility functions
export function formatK(num: number | string): string {
  const n = typeof num === "string" ? parseFloat(num.replace(/,/g, "")) : num;
  if (isNaN(n)) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
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
  if (/[a-zA-Z]/.test(value)) return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;

  // Special handling for ETH values
  if (uom === "ETH") {
    return num.toFixed(3);
  }

  // Existing handling for other values
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
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

// Server-side cache store
const serverCache = new Map<
  string,
  { data: unknown; timestamp: number; maxAge: number }
>();

export function getCachedData<T>(key: string, maxAgeMs: number): T | null {
  // Client-side: use localStorage
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp }: CachedData<T> = JSON.parse(cached);
      if (Date.now() - timestamp < maxAgeMs) {
        return data;
      }

      // Data is stale, remove it
      localStorage.removeItem(key);
      return null;
    } catch {
      // Invalid cache data, remove it
      localStorage.removeItem(key);
      return null;
    }
  }

  // Server-side: use in-memory cache with unstable_cache for persistence
  const cached = serverCache.get(key);
  if (cached) {
    if (Date.now() - cached.timestamp < cached.maxAge) {
      return cached.data as T;
    }
    // Data is stale, remove it
    serverCache.delete(key);
  }

  return null;
}

export function setCachedData<T>(
  key: string,
  data: T,
  maxAgeMs?: number,
): void {
  // Client-side: use localStorage
  if (typeof window !== "undefined") {
    try {
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cachedData));
    } catch {
      // Storage quota exceeded or other error, silently fail
    }
    return;
  }

  // Server-side: use in-memory cache
  const cacheMaxAge = maxAgeMs || 300000; // 5 minutes default
  serverCache.set(key, {
    data,
    timestamp: Date.now(),
    maxAge: cacheMaxAge,
  });
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
  SCORE_BREAKDOWN: 30 * 60 * 1000, // 30 minutes (until profile updates)
  EXPENSIVE_COMPUTATION: 30 * 60 * 1000, // 30 minutes for expensive computations
  ETH_PRICE: 24 * 60 * 60 * 1000, // 24 hours
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
    return `${(value / 1000).toFixed(2)}K`;
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

// Helper to format currency
export function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(2)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${formatWithK(amount)}`;
  }
  return `$${amount}`;
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

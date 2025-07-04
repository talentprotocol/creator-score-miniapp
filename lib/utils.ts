import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
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

    // Cache the price
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

export async function calculateTotalRewards(
  credentials: Array<{
    points: Array<{
      label: string;
      uom: string | null;
      readable_value: string | null;
    }>;
  }>,
  getEthUsdcPriceFn: () => Promise<number>,
): Promise<number> {
  const ethPrice = await getEthUsdcPriceFn();

  // Sum up all rewards, converting ETH to USDC
  const total = credentials.reduce((sum, issuer) => {
    const issuerTotal = issuer.points.reduce((acc, pt) => {
      // Only count credentials that are creator earnings
      if (!isEarningsCredential(pt.label)) {
        return acc;
      }

      if (!pt.readable_value) {
        return acc;
      }

      // Parse value handling K/M suffixes
      let value: number;
      const cleanValue = pt.readable_value.replace(/[^0-9.KM-]+/g, "");
      if (cleanValue.includes("K")) {
        value = parseFloat(cleanValue.replace("K", "")) * 1000;
      } else if (cleanValue.includes("M")) {
        value = parseFloat(cleanValue.replace("M", "")) * 1000000;
      } else {
        value = parseFloat(cleanValue);
      }

      if (isNaN(value)) {
        return acc;
      }

      let contribution = 0;
      if (pt.uom === "ETH") {
        contribution = convertEthToUsdc(value, ethPrice);
      } else if (pt.uom === "USDC") {
        contribution = value;
      }

      return acc + contribution;
    }, 0);

    return sum + issuerTotal;
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

// Generic caching utility
interface CachedData<T> {
  data: T;
  timestamp: number;
}

export function getCachedData<T>(key: string, maxAgeMs: number): T | null {
  if (typeof window === "undefined") return null;

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

export function setCachedData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;

  try {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cachedData));
  } catch {
    // Storage quota exceeded or other error, silently fail
  }
}

// Cache duration constants
export const CACHE_DURATIONS = {
  PROFILE_DATA: 5 * 60 * 1000, // 5 minutes
  SCORE_BREAKDOWN: 30 * 60 * 1000, // 30 minutes (until profile updates)
  ETH_PRICE: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export { resolveTalentUser } from "./user-resolver";

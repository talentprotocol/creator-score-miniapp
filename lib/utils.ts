import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
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

interface CachedPrice {
  price: number;
  timestamp: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_KEY = "eth_usdc_price";

export async function getEthUsdcPrice(): Promise<number> {
  // Check cache first
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { price, timestamp }: CachedPrice = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return price;
      }
    }
  }

  try {
    const response = await fetch(
      "https://api.coinbase.com/v2/prices/ETH-USD/spot",
    );
    const data = await response.json();
    const price = parseFloat(data.data.amount);

    // Cache the price
    if (typeof window !== "undefined") {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          price,
          timestamp: Date.now(),
        }),
      );
    }

    return price;
  } catch (error) {
    console.error("Failed to fetch ETH price:", error);
    return 3000; // Conservative fallback price
  }
}

export function convertEthToUsdc(ethAmount: number, ethPrice: number): number {
  return ethAmount * ethPrice;
}

export function formatNumberWithSuffix(num: number): string {
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
  const debugBreakdown: Array<{
    label: string;
    uom: string | null;
    value: number;
    contribution: number;
  }> = [];
  // Sum up all rewards, converting ETH to USDC
  const total = credentials.reduce((sum, issuer) => {
    const issuerTotal = issuer.points.reduce((acc, pt) => {
      // Skip ETH Balance credential
      if (pt.label === "ETH Balance") {
        return acc;
      }
      if (!pt.readable_value) return acc;
      const value = parseFloat(pt.readable_value.replace(/[^0-9.-]+/g, ""));
      if (isNaN(value)) return acc;
      let contribution = 0;
      if (pt.uom === "ETH") {
        contribution = convertEthToUsdc(value, ethPrice);
      } else if (pt.uom === "USDC") {
        contribution = value;
      }
      debugBreakdown.push({
        label: pt.label,
        uom: pt.uom,
        value,
        contribution,
      });
      return acc + contribution;
    }, 0);
    return sum + issuerTotal;
  }, 0);
  return total;
}

export function formatRewardValue(num: number): string {
  return formatNumberWithSuffix(num);
}

/**
 * Resolves a Talent Protocol user identifier (fname, FID, or wallet address) to a user object.
 * Always calls /api/talent-user?id=identifier and lets the API route determine account_source.
 * Returns { fid, fname, ... } or null if not found.
 */
export async function resolveTalentUser(identifier: string): Promise<{
  fid: number | null;
  wallet: string | null;
  github: string | null;
  fname: string | null;
  display_name: string | null;
  image_url: string | null;
  [key: string]: unknown;
} | null> {
  let baseUrl = "";
  if (typeof window === "undefined") {
    baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  }
  const res = await fetch(`${baseUrl}/api/talent-user?id=${identifier}`);
  if (res.ok) {
    const user = await res.json();
    // Accept if any identifier is present
    if (user && (user.fid || user.wallet || user.github)) return user;
  }
  return null;
}

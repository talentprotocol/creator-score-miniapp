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
    (addr): addr is string => typeof addr === "string" && addr.startsWith("0x"),
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

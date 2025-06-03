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

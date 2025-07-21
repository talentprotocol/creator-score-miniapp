#!/usr/bin/env node

/**
 * Clear client-side cache for testing
 * Run with: node scripts/clear-cache.js
 */

console.log("🧹 Clearing client-side cache...");

// This script can be run to clear localStorage cache entries
// In a real app, you'd want to clear specific cache keys

const cacheKeys = [
  "cache:leaderboard:top_200",
  "cache:leaderboard:top_200_total_scores",
  "cache:minikit:user:",
];

console.log("Cache keys to clear:");
cacheKeys.forEach((key) => {
  console.log(`  - ${key}`);
});

console.log("\nTo clear cache in browser:");
console.log("1. Open browser dev tools");
console.log("2. Go to Application/Storage tab");
console.log('3. Clear localStorage entries starting with "cache:"');
console.log("\nOr run this in browser console:");
console.log(
  'Object.keys(localStorage).filter(k => k.startsWith("cache:")).forEach(k => localStorage.removeItem(k));',
);

console.log("\n✅ Cache clearing instructions provided");

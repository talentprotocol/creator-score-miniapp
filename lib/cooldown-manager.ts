import React from "react";

/**
 * COOLDOWN MANAGER
 *
 * Manages refresh cooldowns using localStorage for persistence.
 * Provides reliable 1-hour cooldown enforcement independent of API state.
 *
 * Features:
 * - User-scoped cooldown tracking
 * - Automatic cleanup of expired entries
 * - Cross-tab synchronization via localStorage events
 * - Fallback handling for localStorage unavailability
 */

interface CooldownEntry {
  talentUuid: string;
  refreshedAt: number; // timestamp in milliseconds
  expiresAt: number; // timestamp in milliseconds
}

interface CooldownStore {
  [talentUuid: string]: CooldownEntry;
}

const COOLDOWN_STORAGE_KEY = "talent_refresh_cooldowns";
const COOLDOWN_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get current cooldown store from localStorage
 */
function getCooldownStore(): CooldownStore {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (!stored) return {};

    const parsed = JSON.parse(stored) as CooldownStore;

    // Clean up expired entries
    const now = Date.now();
    const cleaned: CooldownStore = {};

    Object.values(parsed).forEach((entry) => {
      if (entry.expiresAt > now) {
        cleaned[entry.talentUuid] = entry;
      }
    });

    // Save cleaned store back if we removed anything
    if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
      localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(cleaned));
    }

    return cleaned;
  } catch (error) {
    console.warn("Failed to read cooldown store:", error);
    return {};
  }
}

/**
 * Save cooldown store to localStorage
 */
function saveCooldownStore(store: CooldownStore): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn("Failed to save cooldown store:", error);
  }
}

/**
 * Record a refresh for a user
 */
export function recordRefresh(talentUuid: string): void {
  if (!talentUuid) return;

  const now = Date.now();
  const entry: CooldownEntry = {
    talentUuid,
    refreshedAt: now,
    expiresAt: now + COOLDOWN_DURATION_MS,
  };

  const store = getCooldownStore();
  store[talentUuid] = entry;
  saveCooldownStore(store);

  console.log(
    `[CooldownManager] Recorded refresh for ${talentUuid}, expires at ${new Date(entry.expiresAt).toLocaleTimeString()}`,
  );
}

/**
 * Get remaining cooldown minutes for a user
 * Returns null if no cooldown is active
 */
export function getCooldownMinutes(talentUuid: string): number | null {
  if (!talentUuid) return null;

  const store = getCooldownStore();
  const entry = store[talentUuid];

  if (!entry) return null;

  const now = Date.now();

  if (now >= entry.expiresAt) {
    // Expired, clean up
    delete store[talentUuid];
    saveCooldownStore(store);
    return null;
  }

  const remainingMs = entry.expiresAt - now;
  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

  return remainingMinutes;
}

/**
 * Check if a user is currently in cooldown
 */
export function isInCooldown(talentUuid: string): boolean {
  return getCooldownMinutes(talentUuid) !== null;
}

/**
 * Get the timestamp when the user last refreshed
 */
export function getLastRefreshTime(talentUuid: string): Date | null {
  if (!talentUuid) return null;

  const store = getCooldownStore();
  const entry = store[talentUuid];

  return entry ? new Date(entry.refreshedAt) : null;
}

/**
 * Clear cooldown for a user (for testing/admin purposes)
 */
export function clearCooldown(talentUuid: string): void {
  if (!talentUuid) return;

  const store = getCooldownStore();
  delete store[talentUuid];
  saveCooldownStore(store);

  console.log(`[CooldownManager] Cleared cooldown for ${talentUuid}`);
}

/**
 * Clear all expired cooldowns (cleanup utility)
 */
export function cleanupExpiredCooldowns(): number {
  const store = getCooldownStore();
  const originalCount = Object.keys(store).length;

  // getCooldownStore() already cleans up expired entries
  const cleanedStore = getCooldownStore();
  const cleanedCount = Object.keys(cleanedStore).length;

  const removedCount = originalCount - cleanedCount;

  if (removedCount > 0) {
    console.log(
      `[CooldownManager] Cleaned up ${removedCount} expired cooldown entries`,
    );
  }

  return removedCount;
}

/**
 * Hook for reactive cooldown tracking
 */
export function useCooldownTracker(talentUuid: string) {
  const [cooldownMinutes, setCooldownMinutes] = React.useState<number | null>(
    null,
  );

  React.useEffect(() => {
    if (!talentUuid) {
      setCooldownMinutes(null);
      return;
    }

    // Calculate cooldown immediately
    const updateCooldown = () => {
      const minutes = getCooldownMinutes(talentUuid);
      setCooldownMinutes(minutes);
    };

    updateCooldown();

    // Update every minute
    const interval = setInterval(updateCooldown, 60000);

    // Listen for localStorage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COOLDOWN_STORAGE_KEY) {
        updateCooldown();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [talentUuid]);

  return cooldownMinutes;
}

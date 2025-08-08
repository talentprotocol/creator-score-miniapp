// Client-side and server-side caching utility
// This provides caching functionality for both environments

import {
  getCachedData as utilsGetCachedData,
  setCachedData as utilsSetCachedData,
} from "./utils";

export function getCachedData<T>(key: string): T | null {
  // Use the updated utils function which handles both client and server
  return utilsGetCachedData<T>(key, 3600000); // Default 1 hour TTL
}

export function setCachedData<T>(key: string, data: T): void {
  // Use the updated utils function which handles both client and server
  utilsSetCachedData<T>(key, data);
}

export function clearCache(key?: string): void {
  if (typeof window !== "undefined") {
    if (key) {
      localStorage.removeItem(key);
    } else {
      // Clear all cache entries
      const keys = Object.keys(localStorage);
      keys.forEach((k) => {
        if (k.startsWith("cache:")) {
          localStorage.removeItem(k);
        }
      });
    }
  }
  // Note: Server-side cache clearing would need to be implemented separately
  // if needed, as the in-memory cache is per-process
}

// Legacy Redis-like interface for compatibility
export const redis = {
  get: <T>(key: string): Promise<T | null> => {
    return Promise.resolve(getCachedData<T>(key));
  },
  set: <T>(key: string, value: T): Promise<void> => {
    setCachedData(key, value);
    return Promise.resolve();
  },
  setex: <T>(key: string, ttlSeconds: number, value: T): Promise<void> => {
    setCachedData(key, value);
    return Promise.resolve();
  },
  del: (key: string): Promise<void> => {
    clearCache(key);
    return Promise.resolve();
  },
};

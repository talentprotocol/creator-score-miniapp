// Client-side caching utility to replace Redis
// This provides similar functionality using localStorage

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export function getCachedData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    if (now - entry.timestamp > entry.ttl) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function setCachedData<T>(
  key: string,
  data: T,
  ttlMs: number = 3600000,
): void {
  if (typeof window === "undefined") return;

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage quota exceeded or other error, silently fail
  }
}

export function clearCache(key?: string): void {
  if (typeof window === "undefined") return;

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
    setCachedData(key, value, ttlSeconds * 1000);
    return Promise.resolve();
  },
  del: (key: string): Promise<void> => {
    clearCache(key);
    return Promise.resolve();
  },
};

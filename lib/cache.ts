interface CacheEntry<T> {
  data: T;
  expiry: number;
}

// Global in-memory cache shared across API calls in the same serverless container
const globalCache = new Map<string, CacheEntry<any>>();

/**
 * Retrieves cached data by key if present and not expired.
 */
export function getCached<T>(key: string): T | null {
  const entry = globalCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    globalCache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Stores data in memory with a specified TTL in seconds (default 30 seconds).
 */
export function setCached<T>(key: string, data: T, ttlSeconds: number = 30): void {
  // Prevent unbounded memory growth by pruning expired entries
  if (globalCache.size > 2000) {
    const now = Date.now();
    for (const [k, v] of globalCache.entries()) {
      if (now > v.expiry) globalCache.delete(k);
    }
    // If still large, remove oldest 20%
    if (globalCache.size > 1500) {
      const keys = Array.from(globalCache.keys()).slice(0, 400);
      keys.forEach((k) => globalCache.delete(k));
    }
  }

  globalCache.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Invalidates cache keys matching a prefix or pattern.
 */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    globalCache.clear();
    return;
  }
  for (const k of globalCache.keys()) {
    if (k.startsWith(prefix)) {
      globalCache.delete(k);
    }
  }
}


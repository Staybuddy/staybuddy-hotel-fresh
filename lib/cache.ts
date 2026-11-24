import fs from 'fs';
import path from 'path';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

// Global in-memory cache shared across API calls in the same serverless container
const globalCache = new Map<string, CacheEntry<any>>();

// Long-lived fallback cache (survives expiration during DB quota issues or network downtime)
const fallbackCache = new Map<string, any>();

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'staybuddy_fallback.json');

// Helper to safely load disk cache on server startup
function loadDiskCache(): Record<string, any> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    // Non-fatal if filesystem is read-only
  }
  return {};
}

// Helper to safely save disk cache
function saveDiskCache(key: string, data: any): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    const current = loadDiskCache();
    current[key] = { data, updatedAt: Date.now() };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(current), 'utf-8');
  } catch (e) {
    // Non-fatal
  }
}

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
 * Stores data in memory with a specified TTL in seconds (default 300 seconds / 5 minutes).
 */
export function setCached<T>(key: string, data: T, ttlSeconds: number = 300): void {
  if (globalCache.size > 2000) {
    const now = Date.now();
    for (const [k, v] of globalCache.entries()) {
      if (now > v.expiry) globalCache.delete(k);
    }
    if (globalCache.size > 1500) {
      const keys = Array.from(globalCache.keys()).slice(0, 400);
      keys.forEach((k) => globalCache.delete(k));
    }
  }

  globalCache.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  });

  // Also retain in fallback memory and disk
  fallbackCache.set(key, data);
  saveDiskCache(key, data);
}

/**
 * Retrieves last known good data, ignoring expiration.
 * Used when database throws RESOURCE_EXHAUSTED (quota exceeded) or connection errors.
 */
export function getFallback<T>(key: string): T | null {
  if (fallbackCache.has(key)) {
    return fallbackCache.get(key) as T;
  }
  const disk = loadDiskCache();
  if (disk[key]?.data) {
    fallbackCache.set(key, disk[key].data);
    return disk[key].data as T;
  }
  return null;
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

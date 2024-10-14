/**
 * This simple in-memory cache stores data for decryption and periodically cleans them up based on TTL.
 * If user traffic increases, consider switching to Redis or another distributed caching solution
 * for better scalability and persistence across multiple servers.
 */

const KEY_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const CACHE_CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CacheEntry<T> {
  value: T;
  lastAccessed: number;
}

const cache: { [key: string]: CacheEntry<any> } = {};

export function getFromCache<T>(key: string): T | undefined {
  const cacheEntry = cache[key];
  const now = Date.now();

  if (cacheEntry && now - cacheEntry.lastAccessed < KEY_TTL_MS) {
    cacheEntry.lastAccessed = now;
    return cacheEntry.value;
  }

  return undefined;
}

export function setToCache<T>(key: string, value: T): void {
  const now = Date.now();
  cache[key] = { value, lastAccessed: now };
}

function cleanUpCache() {
  const now = Date.now();
  for (const key in cache) {
    if (now - cache[key].lastAccessed >= KEY_TTL_MS) {
      delete cache[key];
    }
  }
}

setInterval(cleanUpCache, CACHE_CLEANUP_INTERVAL_MS);

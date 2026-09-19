// In-memory TTL cache shared across all scrapers.
// Map-based LRU implementation with max entries and key bounds — no external dependencies.
// Suitable for single-process runtimes (Node server, serverless functions,
// workers). For multi-instance deployments, wrap the cache functions with
// your own Redis/DB-backed store (see README).

export const MAX_CACHE_ENTRIES = 500;
export const MAX_KEY_LENGTH = 512;

const cache = new Map();

/**
 * Get a cached value. Returns null when missing or expired.
 * Updates LRU order on hit.
 * @param {string} key
 * @returns {*} value or null
 */
export function getCache(key) {
  if (typeof key !== 'string' || key.length > MAX_KEY_LENGTH) return null;
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  // LRU: Move to most recently used position
  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

/**
 * Store a value with a TTL and LRU eviction.
 * Rejects keys > 512 chars, and does not cache null/undefined/Error instances.
 * @param {string} key
 * @param {*} value
 * @param {number} ttlSeconds - seconds until expiry (default 1 hour)
 */
export function setCache(key, value, ttlSeconds = 3600) {
  if (typeof key !== 'string' || key.length > MAX_KEY_LENGTH) return;
  if (value === null || value === undefined || value instanceof Error) return;

  if (cache.has(key)) {
    cache.delete(key);
  }

  cache.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  });

  // Evict oldest entries when capacity exceeded
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

/** Remove every cached entry. */
export function clearCache() {
  cache.clear();
}

/** Number of entries currently held. Useful for debugging/monitoring. */
export function cacheSize() {
  return cache.size;
}

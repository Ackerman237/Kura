/**
 * Kura Client-Side Cache Service
 * Provides IndexedDB-backed API response caching with category-based TTL
 * and integration with browser CacheStorage for media assets.
 */

const DB_NAME = 'kura_cache_db';
const DB_VERSION = 1;
const STORE_API = 'api_responses';

export const CACHE_PRESETS = {
  recommended: {
    key: 'recommended',
    label: 'Rekomendasi (Seimbang)',
    homeTtlMin: 15,
    detailTtlMin: 120,
    searchTtlMin: 30,
    imageTtlDays: 7,
    maxStorageMb: 500,
  },
  saver: {
    key: 'saver',
    label: 'Hemat Kuota & Cepat',
    homeTtlMin: 60,
    detailTtlMin: 360,
    searchTtlMin: 60,
    imageTtlDays: 30,
    maxStorageMb: 1000,
  },
  realtime: {
    key: 'realtime',
    label: 'Realtime (Selalu Segar)',
    homeTtlMin: 3,
    detailTtlMin: 30,
    searchTtlMin: 10,
    imageTtlDays: 3,
    maxStorageMb: 250,
  },
  custom: {
    key: 'custom',
    label: 'Kustom',
    homeTtlMin: 15,
    detailTtlMin: 120,
    searchTtlMin: 30,
    imageTtlDays: 7,
    maxStorageMb: 500,
  },
};

const DEFAULT_CONFIG = {
  preset: 'recommended',
  ...CACHE_PRESETS.recommended,
};

let dbPromise = null;

function openCacheDb() {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_API)) {
        const store = db.createObjectStore(STORE_API, { keyPath: 'key' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      console.warn('[Cache] Failed to open IndexedDB:', req.error);
      resolve(null);
    };
  });

  return dbPromise;
}

/**
 * Get active cache configuration from localStorage.
 */
export function getCacheConfig() {
  try {
    const raw = localStorage.getItem('kura_cache_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (_) {}
  return { ...DEFAULT_CONFIG };
}

/**
 * Save cache configuration to localStorage.
 */
export function saveCacheConfig(cfg) {
  try {
    localStorage.setItem('kura_cache_settings', JSON.stringify(cfg));
  } catch (_) {}
}

/**
 * Calculate TTL in milliseconds for a given category.
 */
export function getTtlMsForCategory(category) {
  const cfg = getCacheConfig();
  switch (category) {
    case 'home':
      return (cfg.homeTtlMin || 15) * 60 * 1000;
    case 'detail':
      return (cfg.detailTtlMin || 120) * 60 * 1000;
    case 'search':
      return (cfg.searchTtlMin || 30) * 60 * 1000;
    case 'genres':
    case 'static':
      return 24 * 60 * 60 * 1000; // 24 hours
    default:
      return 15 * 60 * 1000;
  }
}

/**
 * Retrieve cached API response if still within TTL.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function getCachedApi(key) {
  const db = await openCacheDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_API, 'readonly');
      const store = tx.objectStore(STORE_API);
      const req = store.get(key);

      req.onsuccess = () => {
        const item = req.result;
        if (!item) return resolve(null);

        // Check expiration
        if (Date.now() > item.expiresAt) {
          // Asynchronously prune expired entry
          pruneCacheKey(key);
          return resolve(null);
        }

        resolve(item.data);
      };

      req.onerror = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
}

/**
 * Store API response in cache with appropriate expiration.
 * @param {string} key
 * @param {any} data
 * @param {'home'|'detail'|'search'|'genres'|'default'} category
 */
export async function setCachedApi(key, data, category = 'default') {
  if (!data) return;
  const db = await openCacheDb();
  if (!db) return;

  const ttlMs = getTtlMsForCategory(category);
  const record = {
    key,
    data,
    category,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_API, 'readwrite');
      const store = tx.objectStore(STORE_API);
      store.put(record);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (_) {
      resolve(false);
    }
  });
}

/**
 * Prune single cache key
 */
async function pruneCacheKey(key) {
  const db = await openCacheDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_API, 'readwrite');
    tx.objectStore(STORE_API).delete(key);
  } catch (_) {}
}

/**
 * Clear all cached API responses
 */
export async function clearApiCache() {
  const db = await openCacheDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_API, 'readwrite');
      tx.objectStore(STORE_API).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (_) {
      resolve(false);
    }
  });
}

/**
 * Clear browser CacheStorage entries (images / app shell)
 */
export async function clearImageCache() {
  if (typeof caches === 'undefined') return;
  try {
    const keys = await caches.keys();
    for (const key of keys) {
      if (key.includes('image') || key.includes('media') || key.includes('kura-img')) {
        await caches.delete(key);
      }
    }
  } catch (err) {
    console.warn('[Cache] Clear image cache error:', err);
  }
}

/**
 * Clear all client caches (API and Image caches)
 */
export async function clearAllCache() {
  await clearApiCache();
  if (typeof caches !== 'undefined') {
    try {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
    } catch (_) {}
  }
}

/**
 * Estimate storage usage across browser storage APIs.
 * @returns {Promise<{ usage: number, quota: number, percent: number, apiEntryCount: number }>}
 */
export async function getStorageEstimate() {
  let usage = 0;
  let quota = 0;
  let percent = 0;
  let apiEntryCount = 0;

  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate();
      usage = est.usage || 0;
      quota = est.quota || 0;
      percent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
    } catch (_) {}
  }

  const db = await openCacheDb();
  if (db) {
    try {
      apiEntryCount = await new Promise((resolve) => {
        const tx = db.transaction(STORE_API, 'readonly');
        const countReq = tx.objectStore(STORE_API).count();
        countReq.onsuccess = () => resolve(countReq.result || 0);
        countReq.onerror = () => resolve(0);
      });
    } catch (_) {}
  }

  return {
    usage,
    quota,
    percent,
    apiEntryCount,
  };
}

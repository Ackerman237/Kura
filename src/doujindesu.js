// Doujindesu Facade / Orchestrator
// Coordinates input validation, caching, network client, and pure DTO parsers.
// Preserves 100% backward compatibility for exports and configuration.

import { getCache, setCache } from './cache.js';
import { assertSlug, assertInt, assertQuery } from './security.js';
import {
  DEFAULT_BASE_URL,
  DEFAULT_TRUSTED_HOSTS,
  DEFAULT_USER_AGENT,
  validateBaseUrl,
  buildSourceUrl,
  fetchDoujinApi,
} from './sources/doujindesu/client.js';
import {
  mapListItem,
  mapDetail,
  mapGenres,
  mapChapterImages,
} from './sources/doujindesu/parser.js';

// Re-export buildSourceUrl for backward compatibility and direct assertion in security tests
export { buildSourceUrl };

function getInitialBaseUrl() {
  const envUrl = process.env.DOUJIN_BASE_URL;
  if (!envUrl) return DEFAULT_BASE_URL;
  try {
    return validateBaseUrl(envUrl);
  } catch (err) {
    console.warn(
      `[doujin-scraper] Peringatan: DOUJIN_BASE_URL tidak valid (${err.message}). Menggunakan default: ${DEFAULT_BASE_URL}`
    );
    return DEFAULT_BASE_URL;
  }
}

const state = {
  appSecret: process.env.DOUJIN_APP_SECRET || '',
  salt: process.env.DOUJIN_SALT || '',
  baseUrl: getInitialBaseUrl(),
  userAgent: process.env.DOUJIN_USER_AGENT || DEFAULT_USER_AGENT,
  timeoutMs: Number(process.env.DOUJIN_TIMEOUT_MS) || 30000,
  cacheTtl: 3600,
  trustedHosts: new Set(DEFAULT_TRUSTED_HOSTS),
  fetchImpl: globalThis.fetch,
};

if (!state.appSecret || !state.salt) {
  console.warn(
    '[doujin-scraper] DOUJIN_APP_SECRET / DOUJIN_SALT are not set. ' +
      'Set them via environment variables or configureDoujin() — the Doujindesu API will reject requests without them.'
  );
}

/**
 * Override runtime configuration for the Doujindesu source.
 * @param {{appSecret?: string, salt?: string, baseUrl?: string, userAgent?: string, timeoutMs?: number, cacheTtl?: number, trustedHosts?: string|string[], fetchImpl?: Function}} opts
 */
export function configureDoujin(opts = {}) {
  if (opts.trustedHosts !== undefined) {
    const hosts = Array.isArray(opts.trustedHosts) ? opts.trustedHosts : [opts.trustedHosts];
    state.trustedHosts = new Set(hosts.map((h) => String(h).toLowerCase()));
  }
  if (opts.baseUrl !== undefined) {
    state.baseUrl = validateBaseUrl(opts.baseUrl, state.trustedHosts);
  }
  if (opts.appSecret !== undefined) state.appSecret = opts.appSecret;
  if (opts.salt !== undefined) state.salt = opts.salt;
  if (opts.userAgent !== undefined) state.userAgent = opts.userAgent;
  if (opts.timeoutMs !== undefined) state.timeoutMs = opts.timeoutMs;
  if (opts.cacheTtl !== undefined) state.cacheTtl = opts.cacheTtl;
  if (opts.fetchImpl !== undefined) state.fetchImpl = opts.fetchImpl;
}

/**
 * Internal helper to retrieve data with LRU caching.
 * @param {string} path
 * @returns {Promise<any>}
 */
async function apiGet(path) {
  const cacheKey = `doujin:${path}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const data = await fetchDoujinApi(path, state);
  setCache(cacheKey, data, state.cacheTtl);
  return data;
}

/**
 * Fetch a list of manga with full filtering support.
 * @param {object} opts
 * @param {number} [opts.page=1] - page number (1-based)
 * @param {string} [opts.query=''] - search keyword
 * @param {string} [opts.type=''] - 'manga' | 'doujinshi' | 'manhwa'
 * @param {string} [opts.genre=''] - genre slug (e.g. 'netorare')
 * @param {string} [opts.sort='latest_chapter'] - 'latest_chapter' | 'views' | 'rating'
 * @param {number} [opts.limit=24] - items per page
 * @returns {Promise<Array<{title: string, slug: string, thumb: string, rating: number|null, type: string, status: string|null, latestChapter: number|null}>>}
 */
export async function scrapeMangaList({
  page = 1,
  query = '',
  type = '',
  genre = '',
  sort = 'latest_chapter',
  limit = 24,
  withMeta = false,
} = {}) {
  const safePage = assertInt(page, { min: 1, max: 1000, name: 'page', defaultValue: 1 });
  const safeLimit = assertInt(limit, { min: 1, max: 100, name: 'limit', defaultValue: 24 });
  const safeSort = sort ? assertSlug(sort, 'sort') : 'latest_chapter';

  const params = new URLSearchParams({ limit: String(safeLimit), sort: safeSort });
  if (query) {
    const safeQuery = assertQuery(query, { maxLength: 100, name: 'query' });
    params.set('q', safeQuery);
  }
  if (type) params.set('type', assertSlug(type, 'type'));
  if (genre) params.set('genre', assertSlug(genre, 'genre'));
  if (safePage > 1) params.set('offset', String((safePage - 1) * safeLimit));

  const data = await apiGet(`/manga?${params.toString()}`);
  const list = Array.isArray(data) ? data : data?.data || data?.results || [];
  const items = list.map((item) => mapListItem(item, state.baseUrl)).filter(Boolean);

  const rawTotal = typeof data?.total === 'number' ? data.total : (data?.pagination?.total || 0);
  const total = rawTotal || (items.length === safeLimit ? Math.max(safePage * safeLimit + safeLimit * 10, 2400) : (safePage - 1) * safeLimit + items.length);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  if (withMeta) {
    return {
      items,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
    };
  }

  items.total = total;
  items.totalPages = totalPages;
  items.page = safePage;
  items.limit = safeLimit;
  return items;
}

/**
 * Fetch all genres with their manga counts.
 * @returns {Promise<Array<{slug: string, name: string, count: number}>>}
 */
export async function scrapeGenres() {
  const data = await apiGet('/genres?limit=200');
  return mapGenres(data);
}

/**
 * Fetch full detail for a manga by slug.
 * @param {string} slug
 * @returns {Promise<object|null>} normalized detail (title, synopsis, genres, chapters, views, ...)
 */
export async function scrapeMangaDetail(slug) {
  const safeSlug = assertSlug(slug, 'slug');
  const detail = await apiGet(`/manga/${encodeURIComponent(safeSlug)}`);
  return mapDetail(detail, state.baseUrl);
}

/**
 * Fetch the image URLs of a chapter.
 * @param {string|number} id - chapter id
 * @returns {Promise<{images: string[], mangaSlug: string, mangaTitle: string, title: string, number: number|null}>}
 */
export async function scrapeChapterImages(id) {
  const safeId = assertSlug(String(id), 'id');
  const chapter = await apiGet(`/chapters/${encodeURIComponent(safeId)}`);
  return mapChapterImages(chapter);
}

/**
 * Search manga by keyword. Shorthand for scrapeMangaList({ query }).
 * @param {string} query
 * @returns {Promise<Array>} same shape as scrapeMangaList
 */
export async function searchManga(query) {
  const safeQuery = assertQuery(query, { maxLength: 100, name: 'query' });
  const params = new URLSearchParams({ q: safeQuery, limit: '24' });
  const data = await apiGet(`/manga?${params.toString()}`);
  const list = Array.isArray(data) ? data : data?.data || data?.results || [];
  return list.map((item) => mapListItem(item, state.baseUrl)).filter(Boolean);
}

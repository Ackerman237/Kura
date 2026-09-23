// Eporner Facade / Orchestrator
// Coordinates input validation, caching, network client via proxy, and pure DTO parsers.
// Preserves 100% backward compatibility for exports and configuration.

import { getCache, setCache } from './cache.js';
import { safeHttpUrl, assertSlug, assertInt, assertQuery, InvalidInputError } from './security.js';
import {
  DEFAULT_API_BASE,
  DEFAULT_HTML_BASE,
  DEFAULT_USER_AGENT,
  fetchEpornerJson,
  fetchEpornerHtml,
} from './sources/eporner/client.js';
import {
  mapVideo,
  parseEpornerSources,
  parseCategories,
  parseEpornerListing,
  fmtViews,
} from './sources/eporner/parser.js';

const state = {
  apiBase: process.env.EPORNER_API_BASE || DEFAULT_API_BASE,
  htmlBase: process.env.EPORNER_BASE_URL || DEFAULT_HTML_BASE,
  userAgent: process.env.EPORNER_USER_AGENT || DEFAULT_USER_AGENT,
  timeoutMs: Number(process.env.EPORNER_TIMEOUT_MS) || 30000,
  cacheTtl: 600,
};

/**
 * Override runtime configuration for the Eporner source.
 * @param {{apiBase?: string, htmlBase?: string, userAgent?: string, timeoutMs?: number, cacheTtl?: number}} opts
 */
export function configureEporner(opts = {}) {
  if (opts.apiBase !== undefined) state.apiBase = opts.apiBase.replace(/\/+$/, '');
  if (opts.htmlBase !== undefined) state.htmlBase = opts.htmlBase.replace(/\/+$/, '');
  if (opts.userAgent !== undefined) state.userAgent = opts.userAgent;
  if (opts.timeoutMs !== undefined) state.timeoutMs = opts.timeoutMs;
  if (opts.cacheTtl !== undefined) state.cacheTtl = opts.cacheTtl;
}

/**
 * Helper to fetch mp4 source files from the video HTML page.
 * @param {string} id
 * @returns {Promise<Array<{label: string, url: string}>>}
 */
async function scrapeEpornerSources(id) {
  try {
    const html = await fetchEpornerHtml(`${state.htmlBase}/video-${id}/`, state);
    console.log(`[Eporner Scraper] html length for ${id}: ${html.length}, includes dload: ${html.includes('/dload/')}`);
    console.log(`[Eporner Scraper] HTML snippet for ${id}:`, html.slice(0, 800));
    return parseEpornerSources(html, state.htmlBase);
  } catch (err) {
    console.error(`[Eporner Scraper] scrapeEpornerSources failed for ${id}:`, err.message);
    return [];
  }
}

/**
 * Fetch latest videos or search results. Empty query = latest.
 * @param {{page?: number, query?: string, order?: string}} [opts]
 * @returns {Promise<{videos: Array, hasNext: boolean, total: number}>}
 */
export async function scrapeEpornerList({ page = 1, query = '', order = '' } = {}) {
  const safePage = assertInt(page, { min: 1, max: 1000, name: 'page', defaultValue: 1 });
  const safeQuery = query ? assertQuery(query, { maxLength: 100, name: 'query' }) : '';
  const safeOrder = order ? assertSlug(order, 'order') : '';
  const cacheKey = `eporner-list-${safePage}-${safeQuery.toLowerCase()}-${safeOrder}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    per_page: '28',
    page: String(safePage),
    format: 'json',
    thumbsize: 'medium',
  });
  if (safeQuery) params.set('query', safeQuery);
  if (safeOrder) params.set('order', safeOrder);

  const data = await fetchEpornerJson(`${state.apiBase}/video/search/?${params}`, state);
  const videos = (data.videos || []).map(mapVideo).filter(Boolean);
  const pages = data.total_pages || 1;

  const result = { videos, hasNext: safePage < pages, total: data.total_count || 0 };
  setCache(cacheKey, result, state.cacheTtl);
  return result;
}

/**
 * Fetch video detail: embed player iframe + direct mp4 files (src).
 * @param {string} id
 * @returns {Promise<object>} normalized video detail (includes src[], embedUrl)
 */
export async function scrapeEpornerDetail(id) {
  const safeId = assertSlug(id, 'id');

  const cacheKey = `eporner-detail-${safeId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const data = await fetchEpornerJson(
    `${state.apiBase}/video/id?id=${encodeURIComponent(safeId)}&format=json`,
    state
  );
  const v = data.video || data;
  if (!v || !v.id) throw new Error(`Video ${safeId} not found`);

  let src = [];
  if (v.src && typeof v.src === 'object') {
    src = Object.entries(v.src)
      .map(([label, url]) => ({ label, url: safeHttpUrl(url) }))
      .filter((s) => s.url);
  }
  if (src.length === 0) {
    console.log(`[Eporner Detail] v.src was empty, calling scrapeEpornerSources for ${id}...`);
    src = await scrapeEpornerSources(id);
    console.log(`[Eporner Detail] scrapeEpornerSources returned ${src.length} sources for ${id}`);
  }

  const detail = {
    ...mapVideo(v),
    embedUrl: safeHttpUrl(v.embed?.embed_url || `${state.htmlBase}/embed/${id}/`),
    embedThumb: safeHttpUrl(v.embed?.thumb || ''),
    src,
    description: v.description || '',
  };
  if (src.length > 0) {
    setCache(cacheKey, detail, state.cacheTtl);
  }
  return detail;
}

/**
 * Fetch available categories from /cats/.
 * @returns {Promise<Array<{slug: string, name: string}>>}
 */
export async function scrapeEpornerCategories() {
  const cacheKey = 'eporner-categories';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const html = await fetchEpornerHtml(`${state.htmlBase}/cats/`, state);
    const cats = parseCategories(html);
    if (cats.length > 0) setCache(cacheKey, cats, 3600);
    return cats;
  } catch {
    return [];
  }
}

/**
 * Fetch videos from a category page.
 * @param {string} slug - category slug
 * @param {number} [page=1]
 * @returns {Promise<{videos: Array, hasNext: boolean}>}
 */
export async function scrapeEpornerCategory(slug, page = 1) {
  const safeSlug = assertSlug(slug, 'category');
  const safePage = assertInt(page, { min: 1, max: 1000, name: 'page', defaultValue: 1 });

  const cacheKey = `eporner-cat-${safeSlug}-${safePage}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const path =
    safePage <= 1
      ? `/cat/${encodeURIComponent(safeSlug)}/`
      : `/cat/${encodeURIComponent(safeSlug)}/${safePage}/`;
  const html = await fetchEpornerHtml(`${state.htmlBase}${path}`, state);
  const result = parseEpornerListing(html);
  setCache(cacheKey, result, state.cacheTtl);
  return result;
}

/**
 * Fetch videos from a special listing page ('top-rated' or 'most-viewed').
 * @param {string} kind
 * @param {number} [page=1]
 * @returns {Promise<{videos: Array, hasNext: boolean}>}
 */
export async function scrapeEpornerListingPage(kind, page = 1) {
  if (!['top-rated', 'most-viewed'].includes(kind)) throw new InvalidInputError('Invalid kind');
  const safePage = assertInt(page, { min: 1, max: 1000, name: 'page', defaultValue: 1 });
  const cacheKey = `eporner-listing-${kind}-${safePage}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const path = safePage <= 1 ? `/${kind}/` : `/${kind}/${safePage}/`;
  const html = await fetchEpornerHtml(`${state.htmlBase}${path}`, state);
  const result = parseEpornerListing(html);
  setCache(cacheKey, result, state.cacheTtl);
  return result;
}

/**
 * Related/recommended videos (YouTube-style) for a watch page.
 * @param {string} id
 * @param {{tags?: string[], title?: string, limit?: number}} [opts]
 * @returns {Promise<Array<{id: string, title: string, thumb: string, duration: string, url: string, views: number, meta: string}>>}
 */
export async function scrapeEpornerRelated(id, { tags = [], title = '', limit = 12 } = {}) {
  const safeId = assertSlug(id, 'id');
  const safeLimit = assertInt(limit, { min: 1, max: 100, name: 'limit', defaultValue: 12 });
  const cacheKey = `eporner-related-${safeId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const seen = new Set([safeId]);
  const items = [];

  const queryTags = tags.filter(Boolean).slice(0, 2);
  for (const tag of queryTags) {
    try {
      const { videos } = await scrapeEpornerList({ page: 1, query: tag });
      for (const v of videos) {
        if (seen.has(v.id)) continue;
        seen.add(v.id);
        items.push({ ...v, score: 50 });
      }
    } catch {
      // skip
    }
    if (items.length >= limit) break;
  }

  if (items.length < limit) {
    const kw = (title || '').split(/\s+/).find((w) => w.length > 4) || '';
    const extraQueries = [kw].filter(Boolean);
    for (const q of [...extraQueries, '', '']) {
      const page = q ? 1 : [1, 2, Math.floor(Math.random() * 9) + 2][items.length % 3];
      try {
        const { videos } = await scrapeEpornerList({ page, query: q });
        for (const v of videos) {
          if (seen.has(v.id)) continue;
          seen.add(v.id);
          items.push({ ...v, score: q ? 30 : Math.random() * 10 });
        }
      } catch {
        // skip
      }
      if (items.length >= limit) break;
    }
  }

  const tagged = items.filter((v) => v.score >= 30);
  const rest = items.filter((v) => v.score < 30);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const pool = [...tagged, ...rest];
  const result = pool.slice(0, limit).map((v) => ({
    id: v.id,
    title: v.title,
    thumb: v.thumb,
    duration: v.duration,
    url: `${state.htmlBase}/video-${v.id}/`,
    views: v.views,
    meta: `${fmtViews(v.views)} views`,
  }));

  setCache(cacheKey, result, 120);
  return result;
}

/**
 * Fetch a random video id (for a "shuffle" button).
 * @returns {Promise<string>} id or empty string
 */
export async function scrapeEpornerRandomId() {
  const page = Math.floor(Math.random() * 9) + 1;
  try {
    const { videos } = await scrapeEpornerList({ page });
    return videos.length ? videos[Math.floor(Math.random() * videos.length)].id : '';
  } catch {
    return '';
  }
}
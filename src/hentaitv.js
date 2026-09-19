// Hentai.tv Facade / Orchestrator
// Coordinates input validation, caching, network client, and pure DTO parsers.
// Preserves 100% backward compatibility for exports and configuration.

import { getCache, setCache } from './cache.js';
import { assertSlug, assertInt, assertQuery } from './security.js';
import {
  DEFAULT_BASE_URL,
  DEFAULT_USER_AGENT,
  fetchHentaiJson,
  fetchHentaiHtml,
  fetchHentaiRandomRedirect,
} from './sources/hentaitv/client.js';
import {
  mapVideo,
  parseHentaiDetailHtml,
  parseRscVideos,
  parseGenres,
  parseSeries,
  fmtViews,
} from './sources/hentaitv/parser.js';

const state = {
  baseUrl: process.env.HENTAI_BASE_URL || DEFAULT_BASE_URL,
  userAgent: process.env.HENTAI_USER_AGENT || DEFAULT_USER_AGENT,
  timeoutMs: Number(process.env.HENTAI_TIMEOUT_MS) || 30000,
  cacheTtl: 600,
  fetchImpl: globalThis.fetch,
};

/**
 * Override runtime configuration for the Hentai.tv source.
 * @param {{baseUrl?: string, userAgent?: string, timeoutMs?: number, cacheTtl?: number, fetchImpl?: Function}} opts
 */
export function configureHentai(opts = {}) {
  if (opts.baseUrl !== undefined) state.baseUrl = opts.baseUrl.replace(/\/+$/, '');
  if (opts.userAgent !== undefined) state.userAgent = opts.userAgent;
  if (opts.timeoutMs !== undefined) state.timeoutMs = opts.timeoutMs;
  if (opts.cacheTtl !== undefined) state.cacheTtl = opts.cacheTtl;
  if (opts.fetchImpl !== undefined) state.fetchImpl = opts.fetchImpl;
}

/**
 * Fetch video list (browse) or search results. Empty query = all.
 * @param {{page?: number, query?: string}} [opts]
 * @returns {Promise<{videos: Array, hasNext: boolean, total: number}>}
 */
export async function scrapeHentaiList({ page = 1, query = '' } = {}) {
  const safePage = assertInt(page, { min: 1, max: 1000, name: 'page', defaultValue: 1 });
  const safeQuery = query ? assertQuery(query, { maxLength: 100, name: 'query' }) : '';
  const cacheKey = `hentai-list-${safePage}-${safeQuery.toLowerCase()}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ page: String(safePage) });
  if (safeQuery) params.set('search', safeQuery);

  const data = await fetchHentaiJson(`/api/browse?${params}`, state);
  const videos = (data.videos || []).map((v) => mapVideo(v, state.baseUrl)).filter(Boolean);
  const pages = data.pages || 1;

  const result = { videos, hasNext: safePage < pages, total: data.total || 0 };
  setCache(cacheKey, result, state.cacheTtl);
  return result;
}

/**
 * Fetch video detail by slug.
 * @param {string} slug
 * @returns {Promise<object>} normalized video detail
 */
export async function scrapeHentaiDetail(slug) {
  const safeSlug = assertSlug(slug, 'slug');
  const cacheKey = `hentai-detail-${safeSlug}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  let html;
  try {
    html = await fetchHentaiHtml(`/hentai/${encodeURIComponent(safeSlug)}`, state);
  } catch {
    // Fallback: API search (full-text) — only works if slug == title
    const data = await fetchHentaiJson(`/api/browse?search=${encodeURIComponent(safeSlug)}`, state);
    const v = (data.videos || []).find((item) => item.slug === safeSlug);
    if (!v) throw new Error(`Video ${safeSlug} not found`);
    const detail = mapVideo(v, state.baseUrl);
    setCache(cacheKey, detail, state.cacheTtl);
    return detail;
  }

  const detail = parseHentaiDetailHtml(html, safeSlug);
  if (!detail.embedUrl) throw new Error(`Video ${safeSlug} has no player`);
  setCache(cacheKey, detail, state.cacheTtl);
  return detail;
}

/**
 * Fetch videos by genre (parsed from the actual genre page HTML).
 * @param {string} slug - genre slug
 * @param {number} [page=1]
 * @returns {Promise<{videos: Array, total: number, hasNext: boolean}>}
 */
export async function scrapeHentaiGenre(slug, page = 1) {
  const safeSlug = assertSlug(slug, 'genre');
  const safePage = assertInt(page, { min: 1, max: 1000, name: 'page', defaultValue: 1 });
  const cacheKey = `hentai-genre-${safeSlug}-${safePage}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const path =
    safePage <= 1
      ? `/genre/${encodeURIComponent(safeSlug)}/`
      : `/genre/${encodeURIComponent(safeSlug)}/?page=${safePage}`;
  const html = await fetchHentaiHtml(path, state);

  // Deduplicate — RSC may contain prefetched next-page videos
  const seen = new Set();
  const videos = parseRscVideos(html)
    .map((v) => mapVideo(v, state.baseUrl))
    .filter((v) => {
      if (!v || seen.has(v.slug)) return false;
      seen.add(v.slug);
      return true;
    });

  const totalMatch = html.match(/([0-9][0-9,]*)(?:<!-- -->)?\s*titles/i);
  const total = totalMatch ? parseInt(totalMatch[1].replace(/,/g, ''), 10) || 0 : videos.length;
  const hasNext = safePage < Math.ceil(total / 28);

  const result = { videos, total, hasNext };
  setCache(cacheKey, result, state.cacheTtl);
  return result;
}

/**
 * Fetch all available genres.
 * @returns {Promise<Array<{slug: string, name: string}>>}
 */
export async function scrapeHentaiGenres() {
  const cacheKey = 'hentai-genres';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const html = await fetchHentaiHtml('/genres/', state);
  const genres = parseGenres(html);

  setCache(cacheKey, genres, 3600);
  return genres;
}

/**
 * Fetch all series.
 * @returns {Promise<Array<{slug: string, name: string}>>}
 */
export async function scrapeHentaiSeries() {
  const cacheKey = 'hentai-series';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const html = await fetchHentaiHtml('/series/', state);
  const series = parseSeries(html);

  setCache(cacheKey, series, 3600);
  return series;
}

/**
 * Fetch episodes of a series.
 * @param {string} slug - series slug
 * @returns {Promise<{videos: Array, totalEpisodes: number, title: string}>}
 */
export async function scrapeHentaiSeriesDetail(slug) {
  const safeSlug = assertSlug(slug, 'series');
  const cacheKey = `hentai-series-detail-${safeSlug}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const html = await fetchHentaiHtml(`/series/${encodeURIComponent(safeSlug)}/`, state);
  const videos = parseRscVideos(html)
    .map((v) => mapVideo(v, state.baseUrl))
    .filter(Boolean);

  const epMatch = html.match(/([0-9][0-9,]*)(?:<!-- -->)?\s*episodes/i);
  const totalEpisodes = epMatch ? parseInt(epMatch[1].replace(/,/g, ''), 10) || videos.length : videos.length;

  const result = { videos, totalEpisodes, title: safeSlug.replace(/-/g, ' ') };
  setCache(cacheKey, result, state.cacheTtl);
  return result;
}

/**
 * Fetch a random video slug (follows the /random 307 redirect manually).
 * @returns {Promise<string>} slug or empty string
 */
export async function scrapeHentaiRandomSlug() {
  return fetchHentaiRandomRedirect(state);
}

/**
 * Trending videos from the /trending page.
 * @returns {Promise<{videos: Array, hasNext: boolean, total: number}>}
 */
export async function scrapeHentaiTrending() {
  const cacheKey = 'hentai-trending';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const html = await fetchHentaiHtml('/trending', state);
  const seen = new Set();
  const videos = parseRscVideos(html)
    .map((v) => mapVideo(v, state.baseUrl))
    .filter((v) => {
      if (!v || seen.has(v.slug)) return false;
      seen.add(v.slug);
      return true;
    });

  const result = { videos, hasNext: false, total: videos.length };
  setCache(cacheKey, result, 1800);
  return result;
}

/**
 * Most viewed videos: aggregate several /api/browse pages and sort by views DESC.
 * @returns {Promise<{videos: Array, hasNext: boolean, total: number}>}
 */
export async function scrapeHentaiMostViewed() {
  const cacheKey = 'hentai-most-viewed';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const pages = [1, 2, 3, 5, 8, 13];
  const seen = new Set();
  const videos = [];
  await Promise.all(
    pages.map(async (p) => {
      try {
        const { videos: pageVideos } = await scrapeHentaiList({ page: p });
        for (const v of pageVideos) {
          if (seen.has(v.slug)) continue;
          seen.add(v.slug);
          videos.push(v);
        }
      } catch {
        // skip failed pages
      }
    })
  );

  videos.sort((a, b) => (b.views || 0) - (a.views || 0));

  const result = { videos: videos.slice(0, 60), hasNext: false, total: videos.length };
  setCache(cacheKey, result, 3600);
  return result;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Related/recommended videos for a watch page.
 * @param {string} slug
 * @param {{limit?: number}} [opts]
 * @returns {Promise<Array<{slug: string, title: string, displayTitle: string, thumb: string, duration: string, url: string, views: number, meta: string}>>}
 */
export async function scrapeHentaiRelated(slug, { limit = 12 } = {}) {
  const safeSlug = assertSlug(slug, 'slug');
  const safeLimit = assertInt(limit, { min: 1, max: 100, name: 'limit', defaultValue: 12 });
  const cacheKey = `hentai-related-${safeSlug}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const current = await scrapeHentaiDetail(safeSlug);
  const titleSlug = current.titleSlug || safeSlug.replace(/-episode-\d+$/, '');

  const pages = [1, 2, 3];
  pages.push(Math.floor(Math.random() * 39) + 2);
  pages.push(Math.floor(Math.random() * 39) + 2);
  const candidates = new Map();
  for (const page of pages) {
    try {
      const { videos } = await scrapeHentaiList({ page });
      for (const v of videos) {
        if (v.slug === slug || candidates.has(v.slug)) continue;
        candidates.set(v.slug, v);
      }
    } catch {
      // skip
    }
  }

  const rest = [...candidates.values()];
  const sameSeries = rest.filter((v) => v.titleSlug && v.titleSlug === titleSlug);
  const others = rest.filter((v) => !(v.titleSlug && v.titleSlug === titleSlug));
  shuffle(others);

  const result = sameSeries.concat(others).slice(0, safeLimit).map((v) => ({
    slug: v.slug,
    title: v.title,
    displayTitle: v.displayTitle || v.title,
    thumb: v.thumb,
    duration: v.duration,
    url: `${state.baseUrl}/hentai/${v.slug}`,
    views: v.views,
    meta: v.titleSlug === titleSlug ? 'Series' : `${fmtViews(v.views)} views`,
  }));

  setCache(cacheKey, result, 120);
  return result;
}
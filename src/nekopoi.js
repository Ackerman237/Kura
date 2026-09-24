// NekoPoi Facade / Orchestrator
// Coordinates input validation, caching, network client, and pure DTO parsers.
// Preserves 100% backward compatibility for exports and configuration.

import { getCache, setCache } from './cache.js';
import { assertSlug, assertInt, assertQuery } from './security.js';
import {
  DEFAULT_BASE_URL,
  DEFAULT_USER_AGENT,
  fetchNekoHtml,
} from './sources/nekopoi/client.js';
import {
  parseCards,
  parseDetail,
  parseCategories,
  parseGenres,
} from './sources/nekopoi/parser.js';

const state = {
  baseUrl: process.env.NEKO_BASE_URL || DEFAULT_BASE_URL,
  userAgent: process.env.NEKO_USER_AGENT || DEFAULT_USER_AGENT,
  timeoutMs: Number(process.env.NEKO_TIMEOUT_MS) || 30000,
  cacheTtl: 600,
  fetchImpl: globalThis.fetch,
};

/**
 * Override runtime configuration for the NekoPoi source.
 * @param {{baseUrl?: string, userAgent?: string, timeoutMs?: number, cacheTtl?: number, fetchImpl?: Function}} opts
 */
export function configureNeko(opts = {}) {
  if (opts.baseUrl !== undefined) state.baseUrl = opts.baseUrl.replace(/\/+$/, '');
  if (opts.userAgent !== undefined) state.userAgent = opts.userAgent;
  if (opts.timeoutMs !== undefined) state.timeoutMs = opts.timeoutMs;
  if (opts.cacheTtl !== undefined) state.cacheTtl = opts.cacheTtl;
  if (opts.fetchImpl !== undefined) state.fetchImpl = opts.fetchImpl;
}

/**
 * Fetch the latest video listings.
 * @param {number} [page=1] - page number (1 = home)
 * @returns {Promise<{videos: Array, hasNext: boolean}>}
 */
export async function scrapeNekoList(page = 1, query = '') {
  const safePage = assertInt(page, { min: 1, max: 1000, name: 'page', defaultValue: 1 });
  const safeQuery = query ? assertQuery(query, { maxLength: 100, name: 'query' }) : '';
  const querySuffix = safeQuery ? `?s=${encodeURIComponent(safeQuery)}` : '';
  const path = safePage <= 1 ? `/${querySuffix}` : `/page/${safePage}/${querySuffix}`;
  const html = await fetchNekoHtml(path, state);
  const videos = parseCards(html, state.baseUrl);
  const hasNext = html.includes(`/page/${safePage + 1}/`);
  return { videos, hasNext, page: safePage, total: null };
}

/**
 * Fetch videos by category (e.g. hentai, jav, 2d-animation).
 * @param {string} category - category slug
 * @param {number} [page=1]
 * @returns {Promise<{videos: Array, hasNext: boolean, page: number, total: null}>}
 */
export async function scrapeNekoCategory(category, page = 1) {
  const safeCategory = assertSlug(category, 'category');
  const safePage = assertInt(page, { min: 1, max: 1000, name: 'page', defaultValue: 1 });
  const path =
    safePage <= 1
      ? `/category/${encodeURIComponent(safeCategory)}/`
      : `/category/${encodeURIComponent(safeCategory)}/page/${safePage}/`;
  const html = await fetchNekoHtml(path, state);
  return {
    videos: parseCards(html, state.baseUrl),
    hasNext: html.includes(`/page/${safePage + 1}/`),
    page: safePage,
    total: null,
  };
}

/**
 * Fetch available categories from the category-list page.
 * @returns {Promise<Array<{slug: string, name: string}>>}
 */
export async function scrapeNekoCategories() {
  try {
    const html = await fetchNekoHtml('/hentai-list/', state);
    return parseCategories(html);
  } catch {
    return [];
  }
}

/**
 * Fetch full detail of a video post: title, thumbnail, iframe players, synopsis.
 * @param {string} slug
 * @returns {Promise<{title: string, slug: string, thumb: string, players: string[], synopsis: string}>}
 */
export async function scrapeNekoDetail(slug) {
  const safeSlug = assertSlug(slug, 'slug');
  const cacheKey = `neko-detail-${safeSlug}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const html = await fetchNekoHtml(`/${encodeURIComponent(safeSlug)}/`, state);
  const detail = parseDetail(html, safeSlug);
  setCache(cacheKey, detail, state.cacheTtl);
  return detail;
}

/**
 * Fetch available genres from the genre-list page.
 * @returns {Promise<Array<{slug: string, name: string}>>}
 */
export async function scrapeNekoGenres() {
  try {
    const html = await fetchNekoHtml('/genre-list/', state);
    return parseGenres(html);
  } catch {
    return [];
  }
}

/**
 * Fetch videos from a genre page.
 * @param {string} slug - genre slug
 * @param {number} [page=1]
 * @returns {Promise<{videos: Array, hasNext: boolean, page: number, total: null}>}
 */
export async function scrapeNekoGenre(slug, page = 1) {
  const safeSlug = assertSlug(slug, 'slug');
  const safePage = assertInt(page, { min: 1, max: 1000, name: 'page', defaultValue: 1 });
  const path =
    safePage <= 1
      ? `/genres/${encodeURIComponent(safeSlug)}/`
      : `/genres/${encodeURIComponent(safeSlug)}/page/${safePage}/`;
  const html = await fetchNekoHtml(path, state);
  const videos = parseCards(html, state.baseUrl);
  const hasNext = html.includes(`/genres/${encodeURIComponent(safeSlug)}/page/${safePage + 1}/`);
  return { videos, hasNext, page: safePage, total: null };
}

/**
 * Related/recommended videos (YouTube-style) for a watch page.
 * @param {string} slug - current video slug
 * @param {{limit?: number}} [opts]
 * @returns {Promise<Array<{slug: string, title: string, thumb: string, url: string, synopsis: string, sameSeries: boolean}>>}
 */
export async function scrapeNekoRelated(slug, { limit = 12 } = {}) {
  const safeSlug = assertSlug(slug, 'slug');
  const safeLimit = assertInt(limit, { min: 1, max: 100, name: 'limit', defaultValue: 12 });
  const cacheKey = `neko-related-${safeSlug}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // Root title: strip episode/variant markers from slug
  const stem = safeSlug
    .replace(/-episode-\d+.*$/i, '')
    .replace(/-subtitle-indonesia$/i, '')
    .replace(/-(sub|indonesia|uncensored|censored)$/i, '');

  const pages = [1, 2, 3, Math.floor(Math.random() * 9) + 2];
  const seen = new Set();
  const items = [];
  for (const page of pages) {
    try {
      const { videos } = await scrapeNekoList(page);
      for (const v of videos) {
        if (v.slug === slug || seen.has(v.slug)) continue;
        seen.add(v.slug);
        items.push({
          slug: v.slug,
          title: v.title,
          thumb: v.thumb,
          url: v.url,
          synopsis: v.synopsis,
          sameSeries: v.slug.startsWith(stem) && stem.length >= 8,
        });
      }
    } catch {
      // skip failed pages
    }
  }

  // Same series first, then shuffle
  const sameSeries = items.filter((v) => v.sameSeries);
  const others = items.filter((v) => !v.sameSeries);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }

  const result = [...sameSeries, ...others].slice(0, safeLimit);
  setCache(cacheKey, result, 120);
  return result;
}

/**
 * Fetch a random post slug (for a "shuffle" button).
 * @returns {Promise<string>} slug or empty string
 */
export async function scrapeNekoRandomSlug() {
  const page = Math.floor(Math.random() * 9) + 1;
  try {
    const { videos } = await scrapeNekoList(page);
    return videos.length ? videos[Math.floor(Math.random() * videos.length)].slug : '';
  } catch {
    return '';
  }
}
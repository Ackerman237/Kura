/**
 * Kura Web Client API Service
 * Centralized client for Manga and Cinema video backend routes.
 * Supports Kura Dev-Mode Masking prefix and headers.
 */

import { getCachedApi, setCachedApi } from './clientCache.js';

export function isDevModeActive() {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname.startsWith('/mode-pengembangan') ||
    window.location.search.includes('dev=1')
  );
}

export function setDevModeActive(active) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kura_dev_mode', active ? 'true' : 'false');
}

async function fetchJson(endpoint, options = {}, category = 'default') {
  const isDev = isDevModeActive();
  const prefix = isDev ? '/mode-pengembangan/api' : '/api';
  const url = `${prefix}${endpoint}`;
  const cacheKey = `kura_api_${url}`;
  const forceRefresh = options.forceRefresh || false;

  // 1. Check client-side cache first
  if (!forceRefresh) {
    try {
      const cached = await getCachedApi(cacheKey);
      if (cached) return cached;
    } catch (_) {}
  }

  // 2. Fetch from network
  try {
    const { forceRefresh: _, ...fetchOpts } = options;
    const res = await fetch(url, {
      ...fetchOpts,
      headers: {
        'Accept': 'application/json',
        ...(isDev ? { 'x-dev-mask': '1' } : {}),
        ...(fetchOpts.headers || {}),
      },
    });

    if (!res.ok) {
      let errMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const data = await res.json();
        if (data && data.error) errMsg = data.error;
      } catch (_) {}
      throw new Error(errMsg);
    }

    const data = await res.json();

    // 3. Store valid response in cache asynchronously
    setCachedApi(cacheKey, data, category).catch(() => {});

    return data;
  } catch (err) {
    // 4. Offline fallback: check if cached data exists (even if expired)
    try {
      const stale = await getCachedApi(cacheKey);
      if (stale) {
        console.warn(`[Kura Cache] Menggunakan cache lokal untuk ${url}`);
        return stale;
      }
    } catch (_) {}

    console.error(`[API Service Error] ${url}:`, err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Manga APIs (Doujindesu)
// ---------------------------------------------------------------------------
export async function fetchMangaList({ page = 1, limit = 24, type = 'manga', q = '', genre = '', sort = '', forceRefresh = false } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  if (type && type !== 'all') params.set('type', type);
  if (genre && genre !== 'all') params.set('genre', genre);
  if (sort) params.set('sort', sort);
  if (q && q.trim()) params.set('q', q.trim());

  const category = q && q.trim() ? 'search' : 'home';
  return await fetchJson(`/manga/list?${params.toString()}`, { forceRefresh }, category);
}

export async function fetchMangaGenres({ forceRefresh = false } = {}) {
  return await fetchJson('/manga/genres', { forceRefresh }, 'genres');
}

export async function fetchMangaDetail(slug, { forceRefresh = false } = {}) {
  if (!slug) throw new Error('Manga slug is required');
  return await fetchJson(`/manga/detail/${encodeURIComponent(slug)}`, { forceRefresh }, 'detail');
}

export async function fetchChapterImages(chapterId, { forceRefresh = false } = {}) {
  if (!chapterId) throw new Error('Chapter ID is required');
  return await fetchJson(`/manga/chapter/${encodeURIComponent(chapterId)}`, { forceRefresh }, 'detail');
}

// ---------------------------------------------------------------------------
// Cinema Video APIs (NekoPoi, Hentai.tv, Eporner)
// ---------------------------------------------------------------------------
export async function fetchNekoList(page = 1, { forceRefresh = false } = {}) {
  return await fetchJson(`/video/neko/list?page=${page}`, { forceRefresh }, 'home');
}

export async function fetchNekoDetail(slug, { forceRefresh = false } = {}) {
  if (!slug) throw new Error('Neko slug is required');
  return await fetchJson(`/video/neko/detail/${encodeURIComponent(slug)}`, { forceRefresh }, 'detail');
}

export async function fetchHtvGenres({ forceRefresh = false } = {}) {
  return await fetchJson('/video/htv/genres', { forceRefresh }, 'genres');
}

export async function fetchHtvList({ page = 1, q = '', genre = '', forceRefresh = false } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (genre && genre !== 'all') params.set('genre', genre);
  if (q && q.trim()) params.set('q', q.trim());

  const category = q && q.trim() ? 'search' : 'home';
  return await fetchJson(`/video/htv/list?${params.toString()}`, { forceRefresh }, category);
}

export async function fetchHtvDetail(slug, { forceRefresh = false } = {}) {
  if (!slug) throw new Error('HTV slug is required');
  return await fetchJson(`/video/htv/detail/${encodeURIComponent(slug)}`, { forceRefresh }, 'detail');
}

export async function fetchTubeCategories({ forceRefresh = false } = {}) {
  return await fetchJson('/video/tube/categories', { forceRefresh }, 'genres');
}

export async function fetchTubeList({ page = 1, q = '', category = '', forceRefresh = false } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (category && category !== 'all') params.set('category', category);
  if (q && q.trim()) params.set('q', q.trim());

  const cat = q && q.trim() ? 'search' : 'home';
  return await fetchJson(`/video/tube/list?${params.toString()}`, { forceRefresh }, cat);
}

export async function fetchTubeDetail(id, { forceRefresh = false } = {}) {
  if (!id) throw new Error('Tube video ID is required');
  return await fetchJson(`/video/tube/detail/${encodeURIComponent(id)}`, { forceRefresh }, 'detail');
}

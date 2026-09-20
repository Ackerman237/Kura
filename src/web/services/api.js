/**
 * Kura Web Client API Service
 * Centralized client for Manga and Cinema video backend routes.
 * Supports Noctra Dev-Mode Masking prefix and headers.
 */

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

async function fetchJson(endpoint, options = {}) {
  const isDev = isDevModeActive();
  const prefix = isDev ? '/mode-pengembangan/api' : '/api';
  const url = `${prefix}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(isDev ? { 'x-dev-mask': '1' } : {}),
        ...(options.headers || {}),
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

    return await res.json();
  } catch (err) {
    console.error(`[API Service Error] ${url}:`, err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Manga APIs (Doujindesu)
// ---------------------------------------------------------------------------
export async function fetchMangaList({ page = 1, limit = 24, type = 'manga', q = '', genre = '', sort = '' } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  if (type && type !== 'all') params.set('type', type);
  if (genre && genre !== 'all') params.set('genre', genre);
  if (sort) params.set('sort', sort);
  if (q && q.trim()) params.set('q', q.trim());

  return await fetchJson(`/manga/list?${params.toString()}`);
}

export async function fetchMangaGenres() {
  return await fetchJson('/manga/genres');
}

export async function fetchMangaDetail(slug) {
  if (!slug) throw new Error('Manga slug is required');
  return await fetchJson(`/manga/detail/${encodeURIComponent(slug)}`);
}

export async function fetchChapterImages(chapterId) {
  if (!chapterId) throw new Error('Chapter ID is required');
  return await fetchJson(`/manga/chapter/${encodeURIComponent(chapterId)}`);
}

// ---------------------------------------------------------------------------
// Cinema Video APIs (NekoPoi, Hentai.tv, Eporner)
// ---------------------------------------------------------------------------
export async function fetchNekoList(page = 1) {
  return await fetchJson(`/video/neko/list?page=${page}`);
}

export async function fetchNekoDetail(slug) {
  if (!slug) throw new Error('Neko slug is required');
  return await fetchJson(`/video/neko/detail/${encodeURIComponent(slug)}`);
}

export async function fetchHtvGenres() {
  return await fetchJson('/video/htv/genres');
}

export async function fetchHtvList({ page = 1, q = '', genre = '' } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (genre && genre !== 'all') params.set('genre', genre);
  if (q && q.trim()) params.set('q', q.trim());

  return await fetchJson(`/video/htv/list?${params.toString()}`);
}

export async function fetchHtvDetail(slug) {
  if (!slug) throw new Error('HTV slug is required');
  return await fetchJson(`/video/htv/detail/${encodeURIComponent(slug)}`);
}

export async function fetchTubeCategories() {
  return await fetchJson('/video/tube/categories');
}

export async function fetchTubeList({ page = 1, q = '', category = '' } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (category && category !== 'all') params.set('category', category);
  if (q && q.trim()) params.set('q', q.trim());

  return await fetchJson(`/video/tube/list?${params.toString()}`);
}

export async function fetchTubeDetail(id) {
  if (!id) throw new Error('Tube video ID is required');
  return await fetchJson(`/video/tube/detail/${encodeURIComponent(id)}`);
}

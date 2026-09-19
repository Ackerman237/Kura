// Doujindesu.XXX scraper (https://doujin.desu.xxx)
//
// The site is a React SPA: content is served through its /api/* endpoints and
// responses are encrypted (_enc_resp_) with a time-based XOR algorithm. This
// module mimics exactly what the site's JS bundle does: send X-App-Secret +
// x-device-id headers, then decrypt the response.
//
// Requires credentials: DOUJIN_APP_SECRET and DOUJIN_SALT (env vars or
// configureDoujin()). Without them the API rejects the requests.

import { getCache, setCache } from './cache.js';
import { safeHttpUrl, stripHtml, assertSlug, assertInt, assertQuery } from './security.js';
import { safeFetch, readTextLimited, MAX_RESPONSE_BYTES_JSON } from './http.js';

const DEFAULT_BASE_URL = 'https://doujin.desu.xxx';
const DEFAULT_TRUSTED_HOSTS = new Set(['doujin.desu.xxx']);
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function validateBaseUrl(rawUrl, trustedHosts = DEFAULT_TRUSTED_HOSTS) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('baseUrl tidak valid: URL tidak boleh kosong');
  }
  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error(`baseUrl tidak valid: "${rawUrl}"`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`baseUrl harus menggunakan protokol https: (diterima: "${parsed.protocol}")`);
  }
  if (parsed.username || parsed.password) {
    throw new Error('baseUrl tidak boleh memuat kredensial (user:pass@)');
  }
  if (parsed.port && parsed.port !== '443') {
    throw new Error(`baseUrl menggunakan port non-standar: "${parsed.port}"`);
  }
  const hostname = parsed.hostname.toLowerCase();
  if (!trustedHosts.has(hostname)) {
    throw new Error(`baseUrl tidak terpercaya: "${hostname}"`);
  }
  return parsed.origin;
}

function getInitialBaseUrl() {
  const envUrl = process.env.DOUJIN_BASE_URL;
  if (!envUrl) return DEFAULT_BASE_URL;
  try {
    return validateBaseUrl(envUrl);
  } catch (err) {
    console.warn(`[doujin-scraper] Peringatan: DOUJIN_BASE_URL tidak valid (${err.message}). Menggunakan default: ${DEFAULT_BASE_URL}`);
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
 * Guard pembangunan URL sumber Doujindesu.
 * Memastikan path tidak membajak host (misalnya '//evil.com', '\\evil.com', atau URL absolut).
 * @param {string} baseUrl
 * @param {string} path
 * @returns {URL}
 */
export function buildSourceUrl(baseUrl, path) {
  if (typeof path !== 'string' || !path.trim()) {
    throw new Error('Path tidak boleh kosong');
  }
  const trimmed = path.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('\\\\') || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    throw new Error('Path tidak valid atau mencoba mengubah origin');
  }
  const base = new URL(baseUrl);
  const normalizedPath = trimmed.startsWith('/api')
    ? trimmed
    : `/api${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  const url = new URL(normalizedPath, base);
  if (url.origin !== base.origin) {
    throw new Error('Path mengubah origin');
  }
  return url;
}

/**
 * Membentuk header autentikasi secara terisolasi.
 * Secret HANYA dikirimkan jika URL target mengarah ke origin terpercaya.
 * @param {string} targetUrl
 * @returns {Record<string, string>}
 */
function buildAuthHeaders(targetUrl) {
  const targetParsed = new URL(targetUrl);
  const baseParsed = new URL(state.baseUrl);
  const headers = {
    'x-device-id': deviceId(),
    'x-device-name': 'Desktop',
  };
  if (
    targetParsed.origin === baseParsed.origin &&
    state.trustedHosts.has(targetParsed.hostname.toLowerCase())
  ) {
    if (state.appSecret) {
      headers['X-App-Secret'] = state.appSecret;
      headers['x-app-secret'] = state.appSecret;
    }
  }
  return headers;
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

// ── Decryption (exact port of the site's bundle) ─────────────────────────

// Key generator: hash a string into 32 printable characters.
function generateKey(s) {
  let hash = 0;
  for (let n = 0; n < s.length; n++) {
    hash = (hash << 5) - hash + s.charCodeAt(n);
    hash |= 0;
  }
  let out = '';
  let x = Math.abs(hash) || 123456789;
  for (let n = 0; n < 32; n++) {
    x = (x * 1664525 + 1013904223) % 4294967296;
    out += String.fromCharCode(33 + (x % 93));
  }
  return out;
}

// Chained XOR decryption.
function decryptHex(hex, key) {
  const bytes = [];
  for (let d = 0; d < hex.length; d += 2) {
    const w = hex.substring(d, d + 2);
    if (!w) break;
    bytes.push(parseInt(w, 16));
  }
  const out = [];
  const keyLen = key.length;
  let n = 42;
  for (let d = 0; d < bytes.length; d++) {
    const w = bytes[d];
    const p = key.charCodeAt(d % keyLen);
    const ch = w ^ p ^ (d * 13) ^ n;
    out.push(String.fromCharCode(ch & 255));
    n = (n + w) % 256;
  }
  return out.join('');
}

// Key rotation: 1 bucket per hour; try current bucket ± 1.
function candidateKeys() {
  const bucket = Math.floor(Date.now() / 3600000);
  return [bucket, bucket - 1, bucket + 1].map((b) => generateKey(`${state.salt}_${b}`));
}

function decryptResponse(enc) {
  for (const key of candidateKeys()) {
    try {
      const decrypted = decryptHex(enc, key);
      return JSON.parse(decodeURIComponent(decrypted));
    } catch {
      // try the next key
    }
  }
  throw new Error('Failed to decrypt server response (check DOUJIN_APP_SECRET / DOUJIN_SALT)');
}

// ── HTTP ─────────────────────────────────────────────────────────────────

function deviceId() {
  return 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
}

async function apiGet(path) {
  const cacheKey = `doujin:${path}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const targetUrl = buildSourceUrl(state.baseUrl, path);
  const authHeaders = buildAuthHeaders(targetUrl.href);

  const res = await safeFetch(
    targetUrl.href,
    {
      headers: {
        'User-Agent': state.userAgent,
        Accept: 'application/json',
        ...authHeaders,
      },
      signal: AbortSignal.timeout(state.timeoutMs),
    },
    { fetchImpl: state.fetchImpl }
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${path}`);
  }

  const text = await readTextLimited(res, MAX_RESPONSE_BYTES_JSON);
  let data;
  if (text.includes('_enc_resp_')) {
    data = decryptResponse(JSON.parse(text)._enc_resp_);
  } else {
    data = JSON.parse(text);
  }
  setCache(cacheKey, data, state.cacheTtl);
  return data;
}

// ── Data mapping ─────────────────────────────────────────────────────────

// List item → normalized shape used by consumers (slug, thumb, rating, latestChapter)
function mapListItem(item) {
  if (!item || typeof item !== 'object') return null;
  const latestChapter = Array.isArray(item.chapters) ? item.chapters[0] : null;
  return {
    title: typeof item.title === 'string' ? item.title.slice(0, 500) : '',
    slug: typeof item.slug === 'string' ? item.slug.slice(0, 200) : '',
    thumb: safeHttpUrl(item.cover_url) || (typeof item.cover_url === 'string' && item.cover_url.startsWith('/') ? `${state.baseUrl}${item.cover_url}` : ''),
    rating: item.rating != null ? item.rating : null,
    type: typeof item.type === 'string' ? item.type.slice(0, 50) : 'manga',
    status: typeof item.status === 'string' ? item.status.slice(0, 50) : null,
    latestChapter:
      latestChapter && latestChapter.chapter_number != null
        ? latestChapter.chapter_number
        : null,
  };
}

// Decode HTML entities then strip tags — clean text for synopses.
// The API sends HTML encoded twice (e.g. &amp;gt; = literal "&gt;"), so a
// second decode pass fixes entities that arrive as plain text.
function cleanSynopsis(html) {
  if (!html) return '';
  const decodeEntities = (s) =>
    s
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&');
  let decoded = decodeEntities(html);
  if (decoded.includes('&lt;') || decoded.includes('&gt;') || decoded.includes('&quot;')) {
    decoded = decodeEntities(decoded);
  }
  return decoded
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function mapDetail(detail) {
  if (!detail || typeof detail !== 'object') return null;

  const genres = (Array.isArray(detail.manga_genres) ? detail.manga_genres : [])
    .map((g) => ({
      name: typeof g?.genres?.name === 'string' ? g.genres.name.slice(0, 100) : '',
      slug: typeof g?.genres?.slug === 'string' ? g.genres.slug.slice(0, 100) : '',
    }))
    .filter((g) => g.name);

  const chapters = (Array.isArray(detail.chapters) ? detail.chapters : [])
    .map((ch) => ({
      id: ch?.id,
      number: ch?.chapter_number,
      title: typeof ch?.title === 'string' ? ch.title.slice(0, 300) : '',
      date: ch?.created_at ? new Date(ch.created_at).toLocaleDateString('id-ID') : '',
    }))
    .filter((ch) => ch.id != null);

  return {
    title: typeof detail.title === 'string' ? detail.title.slice(0, 500) : '',
    altTitle: typeof detail.alt_titles === 'string' ? detail.alt_titles.slice(0, 500) : null,
    thumb: safeHttpUrl(detail.cover_url) || (typeof detail.cover_url === 'string' && detail.cover_url.startsWith('/') ? `${state.baseUrl}${detail.cover_url}` : ''),
    rating: detail.rating != null ? detail.rating : null,
    status: typeof detail.status === 'string' ? detail.status.slice(0, 50) : null,
    type: typeof detail.type === 'string' ? detail.type.slice(0, 50) : 'manga',
    synopsis: cleanSynopsis(detail.description),
    author:
      typeof detail.author === 'string'
        ? detail.author.slice(0, 200)
        : typeof detail.author?.name === 'string'
          ? detail.author.name.slice(0, 200)
          : null,
    artist:
      typeof detail.artist === 'string'
        ? detail.artist.slice(0, 200)
        : typeof detail.artist?.name === 'string'
          ? detail.artist.name.slice(0, 200)
          : null,
    genres,
    chapters,
    views: Number.isFinite(detail.views) ? detail.views : 0,
  };
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Fetch a list of manga with full filtering support.
 *
 * Note: the Doujindesu API ignores the `page` parameter — page 1 and 2
 * return identical results. The only correct way to paginate is `offset`.
 * `offset` = (page - 1) * limit.
 *
 * @param {object} opts
 * @param {number} [opts.page=1] - page number (can go deep, into the hundreds)
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
  // The API does not support `page` — use `offset` so pagination actually works.
  if (safePage > 1) params.set('offset', String((safePage - 1) * safeLimit));

  const data = await apiGet(`/manga?${params.toString()}`);
  const list = Array.isArray(data) ? data : data.data || data.results || [];
  return list.map(mapListItem).filter(Boolean);
}

/**
 * Fetch all genres with their manga counts.
 * @returns {Promise<Array<{slug: string, name: string, count: number}>>}
 */
export async function scrapeGenres() {
  const data = await apiGet('/genres?limit=200');
  const list = Array.isArray(data) ? data : data.data || data.results || [];
  return list
    .map((g) => ({
      slug: g.slug,
      name: g.name,
      count: g.manga_count || g._count?.manga_genres || 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Fetch full detail for a manga by slug.
 * @param {string} slug
 * @returns {Promise<object|null>} normalized detail (title, synopsis, genres, chapters, views, ...)
 */
export async function scrapeMangaDetail(slug) {
  const safeSlug = assertSlug(slug, 'slug');
  const detail = await apiGet(`/manga/${encodeURIComponent(safeSlug)}`);
  return mapDetail(detail);
}

/**
 * Fetch the image URLs of a chapter.
 * @param {string|number} id - chapter id
 * @returns {Promise<{images: string[], mangaSlug: string, mangaTitle: string, title: string, number: number|null}>}
 */
export async function scrapeChapterImages(id) {
  const safeId = assertSlug(String(id), 'id');
  const chapter = await apiGet(`/chapters/${encodeURIComponent(safeId)}`);
  if (!chapter.content_urls || chapter.content_urls.length === 0) {
    throw new Error('This chapter has no images yet');
  }
  const images = (Array.isArray(chapter.content_urls) ? chapter.content_urls : [])
    .map((u) => safeHttpUrl(u))
    .filter(Boolean);
  if (images.length === 0) {
    throw new Error('This chapter has no images yet');
  }
  return {
    images,
    mangaSlug: typeof chapter.manga_slug === 'string' ? chapter.manga_slug.slice(0, 200) : '',
    mangaTitle: typeof chapter.manga_title === 'string' ? chapter.manga_title.slice(0, 500) : '',
    title:
      typeof chapter.title === 'string'
        ? chapter.title.slice(0, 500)
        : `Chapter ${chapter.chapter_number || ''}`.trim(),
    number: chapter.chapter_number || null,
  };
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
  const list = Array.isArray(data) ? data : data.data || data.results || [];
  return list.map(mapListItem).filter(Boolean);
}

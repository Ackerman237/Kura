// Hentai.tv Pure Parser
// 100% pure transformation functions: JSON API / HTML / RSC payloads -> clean normalized DTOs.
// No network I/O, no caching side-effects, no global state.

import { safeHttpUrl, stripHtml } from '../../security.js';

/**
 * Format ISO-8601 duration "PT24M48S" -> "24:48".
 * @param {string} iso
 * @returns {string}
 */
export function fmtDuration(iso) {
  if (!iso) return '';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '';
  const h = m[1] ? parseInt(m[1], 10) : 0;
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const sec = m[3] ? parseInt(m[3], 10) : 0;
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

/**
 * Format view count numbers to compact strings (e.g. 1.2M, 45.3K).
 * @param {number} n
 * @returns {string}
 */
export function fmtViews(n) {
  if (!n) return '';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

/**
 * Normalizes raw API or RSC video item into VideoItem DTO.
 * @param {object} v - Raw video item
 * @param {string} [baseUrl='https://hentai.tv'] - Base URL for relative assets
 * @returns {object}
 */
export function mapVideo(v, baseUrl = 'https://hentai.tv') {
  if (!v || typeof v !== 'object') return null;
  const title = stripHtml(v.title || '').trim() || 'Untitled';
  const abs = (p) =>
    p && p.startsWith('http')
      ? safeHttpUrl(p)
      : p
        ? safeHttpUrl(`${baseUrl}${p}`)
        : '';
  const tags = Array.isArray(v.tags) ? v.tags.map(String) : [];

  return {
    id: v.id,
    slug: v.slug,
    title,
    displayTitle: v.ep ? `${title} EP ${v.ep}` : title,
    ep: v.ep || null,
    titleSlug: v.titleSlug || '',
    views: v.views ?? 0,
    likes: v.likes ?? 0,
    rating: v.rating ?? 0,
    censored: !!v.censored,
    brand: v.brand || '',
    quality: v.quality || '',
    year: v.year || '',
    language: v.language || '',
    duration: v.duration || '',
    tags,
    thumb: abs(v.cover || v.thumb || v.featureImage),
    backdrop: abs(v.backdrop),
    embedUrl: safeHttpUrl(v.embedUrl),
    description: stripHtml(v.description || '').trim(),
    releasedAt: v.releasedAt || '',
    source: 'hentaitv',
  };
}

/**
 * Parse JSON-LD VideoObject + genre chips from hentai.tv detail HTML.
 * @param {string} html - Raw HTML of detail page
 * @param {string} slug - Video slug
 * @returns {object}
 */
export function parseHentaiDetailHtml(html, slug) {
  if (typeof html !== 'string' || !html) {
    return { id: slug, slug, title: slug, embedUrl: '', tags: [], source: 'hentaitv' };
  }

  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  let ld = null;
  for (const block of ldMatch) {
    try {
      const parsed = JSON.parse(block.replace(/<script[^>]*>|<\/script>/g, ''));
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const found = arr.find((x) => x && x['@type'] === 'VideoObject' && x.embedUrl);
      if (found) {
        ld = found;
        break;
      }
    } catch {
      // skip non-VideoObject blocks
    }
  }

  let title = ((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
  title = stripHtml(title).trim();
  title = title.replace(/\s*-\s*(Watch.*)?Hentai\.tv.*$/i, '').replace(/\s+at\s+Hentai\.tv®?.*$/i, '').trim();
  title = title.replace(/^Watch\s+/i, '').replace(/\s+Online\s*$/i, '').trim();
  if (!title && ld) title = (ld.name || '').replace(/\s*-\s*Watch.*$/i, '').trim();

  const epMatch = slug.match(/-episode-(\d+)$/);
  const ep = epMatch ? parseInt(epMatch[1], 10) : null;
  const titleSlug = slug.replace(/-episode-\d+$/, '');
  const titleHasEp = ep && new RegExp(`episode\\s*${ep}`, 'i').test(title);
  const displayTitle = ep && !titleHasEp ? `${title} EP ${ep}` : title;

  const tags = [];
  const chipRe = /<a[^>]*class="tag-chip"[^>]*href="\/genre\/[^"]*"[^>]*>([^<]+)<\/a>/g;
  let cm;
  while ((cm = chipRe.exec(html)) !== null) {
    const t = stripHtml(cm[1]).trim();
    if (t && !tags.includes(t)) tags.push(t);
  }
  if (tags.length === 0 && ld && Array.isArray(ld.genre)) {
    for (const g of ld.genre) {
      const t = String(g).trim();
      if (t && !tags.includes(t)) tags.push(t);
    }
  }

  let views = 0;
  try {
    const stat = ld && Array.isArray(ld.interactionStatistic)
      ? ld.interactionStatistic.find((s) => s && s['@type'] === 'InteractionCounter')
      : ld && ld.interactionStatistic;
    views = parseInt(stat && stat.userInteractionCount, 10) || 0;
  } catch {
    views = 0;
  }

  const yearMatch = html.match(/"year":(\d{4})/);
  const year = yearMatch ? yearMatch[1] : '';

  const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
  let thumb = ogMatch ? safeHttpUrl(ogMatch[1]) : '';
  if (!thumb && ld && Array.isArray(ld.thumbnailUrl) && ld.thumbnailUrl[0]) {
    thumb = safeHttpUrl(ld.thumbnailUrl[0]);
  }

  return {
    id: slug,
    slug,
    title,
    displayTitle,
    ep,
    titleSlug,
    views,
    likes: 0,
    rating: 0,
    censored: /censored/i.test(html),
    brand: '',
    quality: '',
    year,
    language: '',
    duration: ld ? fmtDuration(ld.duration) : '',
    tags: tags.slice(0, 20),
    thumb,
    backdrop: '',
    embedUrl: ld ? safeHttpUrl(ld.embedUrl) : '',
    description: ld ? stripHtml(ld.description || '').trim() : '',
    releasedAt: ld ? ld.uploadDate || '' : '',
    source: 'hentaitv',
  };
}

/**
 * Unescape a single RSC payload chunk (JS string literal).
 * @param {string} chunk
 * @returns {string}
 */
export function unescapeRscChunk(chunk) {
  try {
    return JSON.parse(`"${chunk}"`);
  } catch {
    return chunk
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t');
  }
}

/**
 * Join all RSC chunks in an HTML page into a single string.
 * @param {string} html
 * @returns {string}
 */
export function joinRscPayload(html) {
  const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
  let joined = '';
  let m;
  while ((m = re.exec(html)) !== null) {
    joined += unescapeRscChunk(m[1]);
  }
  return joined;
}

/**
 * Extract a balanced JSON object from a string starting at index `start`.
 * @param {string} str
 * @param {number} start
 * @returns {string|null}
 */
export function extractBalancedObject(str, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < str.length; i++) {
    const ch = str[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Strip global widget state from RSC payload to prevent cross-page leakage.
 * @param {string} str
 * @returns {string}
 */
export function stripGlobalWidgets(str) {
  for (const key of ['initialNotifications', 'initialSaved', 'initialHistory']) {
    const marker = `"${key}":[`;
    let idx = str.indexOf(marker);
    while (idx !== -1) {
      const start = idx + marker.length - 1;
      let depth = 0, inString = false, escaped = false, end = -1;
      for (let i = start; i < str.length; i++) {
        const ch = str[i];
        if (inString) {
          if (escaped) escaped = false;
          else if (ch === '\\') escaped = true;
          else if (ch === '"') inString = false;
          continue;
        }
        if (ch === '"') inString = true;
        else if (ch === '[') depth++;
        else if (ch === ']') {
          depth--;
          if (depth === 0) { end = i; break; }
        }
      }
      if (end === -1) break;
      str = str.slice(0, idx) + str.slice(end + 1);
      idx = str.indexOf(marker);
    }
  }
  return str;
}

/**
 * Parse RSC payload -> list of video objects.
 * @param {string} html
 * @returns {Array<object>}
 */
export function parseRscVideos(html) {
  const joined = stripGlobalWidgets(joinRscPayload(html));
  const videos = [];
  const seen = new Set();
  const patterns = [
    /{"id":"/g,
    /{"slug":"[a-z0-9-]+","title":"/g,
    /{"v":{"id":"/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(joined)) !== null && videos.length < 120) {
      const objStr = extractBalancedObject(joined, m.index);
      if (!objStr) break;
      try {
        const obj = JSON.parse(objStr);
        const actual = obj.v || obj;
        if (actual && actual.slug && actual.title && actual.embedUrl && !seen.has(actual.slug)) {
          videos.push(actual);
          seen.add(actual.slug);
        }
      } catch {
        // skip invalid objects
      }
      re.lastIndex = m.index + 1;
    }
  }
  return videos;
}

/**
 * Parse genres list from /genres/ page.
 * @param {string} html
 * @returns {Array<{slug: string, name: string}>}
 */
export function parseGenres(html) {
  if (typeof html !== 'string' || !html) return [];
  const genres = [];
  const re = /href="\/genre\/([a-z0-9-]+)\/?"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const slug = m[1];
    if (!genres.some((g) => g.slug === slug)) {
      genres.push({ slug, name: slug.replace(/-/g, ' ') });
    }
  }
  return genres;
}

/**
 * Parse series list from /series/ page.
 * @param {string} html
 * @returns {Array<{slug: string, name: string}>}
 */
export function parseSeries(html) {
  if (typeof html !== 'string' || !html) return [];
  const series = [];
  const re = /href="\/series\/([a-z0-9-]+)\/?"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const slug = m[1];
    if (!series.some((s) => s.slug === slug)) {
      series.push({ slug, name: slug.replace(/-/g, ' ') });
    }
  }
  return series;
}

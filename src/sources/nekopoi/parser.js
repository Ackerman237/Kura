// NekoPoi Pure HTML Parser
// 100% pure transformation functions: HTML string -> clean normalized DTOs.
// No network I/O, no caching side-effects, no global state.

import { safeHttpUrl, stripHtml } from '../../security.js';

export const ALLOWED_PLAYER_HOSTS = [
  'playmogo.com',
  'streampoi.com',
  'yandex.ru',
  'ok.ru',
  'doodstream.com',
  'dood.re',
  'streamtape.com',
  'mega.nz',
];

/**
 * Decode common HTML entities.
 * @param {string} s
 * @returns {string}
 */
export function decodeEntities(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Parse post card listings from HTML (Home & Category formats).
 * @param {string} html - Raw HTML page
 * @param {string} [baseUrl='https://nekopoi.care'] - Base URL to validate internal links
 * @returns {Array<{title: string, slug: string, url: string, thumb: string, date: string, synopsis: string}>}
 */
export function parseCards(html, baseUrl = 'https://nekopoi.care') {
  if (typeof html !== 'string' || !html) return [];
  const cards = [];
  const normalizedBase = baseUrl.replace(/\/+$/, '');

  const push = (url, rawTitle, thumb, desc) => {
    const title = decodeEntities(stripHtml(rawTitle));
    if (!url || !title) return;
    const cleanUrl = safeHttpUrl(url);
    // Only internal links become cards (prevents external/abusive links)
    if (!cleanUrl.startsWith(normalizedBase)) return;

    let cleanThumb = '';
    if (thumb) {
      const fullThumb = thumb.startsWith('http') ? thumb : `https:${thumb}`;
      cleanThumb = safeHttpUrl(fullThumb);
    }

    cards.push({
      title,
      slug: cleanUrl.split('/').filter(Boolean).pop() || '',
      url: cleanUrl,
      thumb: cleanThumb,
      date: '',
      synopsis: desc ? decodeEntities(stripHtml(desc)) : '',
    });
  };

  // Format 1: nk-post-card (home)
  const parts = html.split('class="nk-post-card"');
  for (let i = 1; i < parts.length; i++) {
    const blk = parts[i];
    const linkMatch = blk.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!linkMatch) continue;
    const thumbMatch = blk.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/);
    const dateMatch = blk.match(/Minggu|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu[^<]*/);
    push(linkMatch[1], linkMatch[2], thumbMatch ? thumbMatch[1] : '', '');
    if (dateMatch && cards.length > 0) {
      cards[cards.length - 1].date = dateMatch[0].trim();
    }
  }

  // Format 2: nk-search-item (category/list)
  const itemRe = /<a href="([^"]+)" class="nk-search-item">([\s\S]*?)<\/a>/g;
  let im;
  while ((im = itemRe.exec(html)) !== null) {
    const blk = im[2];
    const thumbMatch = blk.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/);
    const titleMatch = blk.match(/<h2>([\s\S]*?)<\/h2>/);
    const descMatch = blk.match(/<p[^>]*class="nk-search-desc"[^>]*>([\s\S]*?)<\/p>/);
    push(
      im[1],
      titleMatch ? titleMatch[1] : '',
      thumbMatch ? thumbMatch[1] : '',
      descMatch ? descMatch[1] : ''
    );
  }

  return cards;
}

/**
 * Parse video post detail (title, thumbnail, iframe players, synopsis).
 * @param {string} html - Raw HTML of post detail page
 * @param {string} slug - Video slug
 * @param {string[]} [allowedHosts=ALLOWED_PLAYER_HOSTS] - Permitted embed hosts
 * @returns {{title: string, slug: string, thumb: string, players: string[], synopsis: string}}
 */
export function parseDetail(html, slug, allowedHosts = ALLOWED_PLAYER_HOSTS) {
  if (typeof html !== 'string' || !html) {
    return { title: slug, slug, thumb: '', players: [], synopsis: '' };
  }

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const title = titleMatch
    ? decodeEntities(stripHtml(titleMatch[1].replace(/&#8211;.*$/, '')))
    : slug;

  // Thumbnail: og:image or featured image
  const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
  const thumb = safeHttpUrl(ogMatch ? ogMatch[1] : '');

  // Player: only iframes from known hosts — ads/tracking are discarded
  const players = [];
  const iframeSrcRe = /<iframe[^>]*src="([^"]+)"[^>]*>/g;
  let m;
  while ((m = iframeSrcRe.exec(html)) !== null) {
    const raw = m[1].startsWith('http') ? m[1] : `https:${m[1]}`;
    const clean = safeHttpUrl(raw);
    if (!clean) continue;
    let host;
    try {
      host = new URL(clean).hostname;
    } catch {
      continue;
    }
    // Skip ad/tracking/application iframes
    if (/a-ads|doubleclick|googlesyndication|discord|facebook|twitter|instagram/.test(host)) continue;
    if (allowedHosts.some((h) => host === h || host.endsWith(`.${h}`))) {
      players.push(clean);
    }
  }

  // Synopsis: approximate paragraph after content
  const synopsisMatch = html.match(/<p>([\s\S]{40,600}?)<\/p>/);
  const synopsis = synopsisMatch ? decodeEntities(stripHtml(synopsisMatch[1])) : '';

  return { title, slug, thumb, players, synopsis };
}

/**
 * Parse categories list from /hentai-list/ page.
 * @param {string} html
 * @returns {Array<{slug: string, name: string}>}
 */
export function parseCategories(html) {
  if (typeof html !== 'string' || !html) return [];
  const cats = [];
  const re = /href="https?:\/\/nekopoi\.care\/category\/([^"/]+)\/"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (!cats.some((c) => c.slug === m[1])) {
      cats.push({ slug: m[1], name: m[1].replace(/-/g, ' ') });
    }
  }
  return cats;
}

/**
 * Parse genre list from /genre-list/ page.
 * @param {string} html
 * @returns {Array<{slug: string, name: string}>}
 */
export function parseGenres(html) {
  if (typeof html !== 'string' || !html) return [];
  const genres = [];
  const re = /<a\s+[^>]*href="https?:\/\/nekopoi\.care\/genres\/([^"/]+)\/"[^>]*>([^<]+)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const slug = m[1];
    const name = decodeEntities(stripHtml(m[2])).trim();
    if (!genres.some((g) => g.slug === slug)) {
      genres.push({ slug, name });
    }
  }
  return genres;
}

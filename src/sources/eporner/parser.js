// Eporner Pure Parser
// 100% pure transformation functions: JSON API / HTML strings -> clean normalized DTOs.
// No network I/O, no proxy calls, no caching side-effects, no global state.

import { safeHttpUrl } from '../../security.js';

/**
 * Format views count to compact notation (e.g. 1.5M, 24.3K).
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
 * Normalizes raw API video item into standard video card DTO.
 * @param {object} v - Raw video item from Eporner v2 API
 * @returns {object|null}
 */
export function mapVideo(v) {
  if (!v || typeof v !== 'object') return null;
  const thumb = v.default_thumb?.src || (Array.isArray(v.thumbs) && v.thumbs[0]?.src) || '';
  const tags =
    typeof v.keywords === 'string'
      ? v.keywords.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  return {
    id: v.id,
    slug: v.id,
    title: v.title || 'Untitled',
    thumb: safeHttpUrl(thumb),
    duration: v.length_min || '',
    durationSec: v.length_sec || 0,
    views: v.views ?? 0,
    rate: v.rate || '',
    added: v.added || '',
    tags,
    url: safeHttpUrl(v.url),
    source: 'eporner',
  };
}

/**
 * Parse mp4 download links from HTML (#downloaddiv /dload/<id>/<quality>/ links).
 * @param {string} html - HTML string of video page
 * @param {string} [htmlBase='https://www.eporner.com'] - Base domain
 * @returns {Array<{label: string, url: string}>} sorted by quality descending
 */
export function parseEpornerSources(html, htmlBase = 'https://www.eporner.com') {
  if (typeof html !== 'string' || !html) return [];
  const normalizedBase = htmlBase.replace(/\/+$/, '');
  const found = [];
  const re = /\/dload\/[A-Za-z0-9_-]+\/(\d{3,4})\/[^"]+\.mp4/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const label = `${m[1]}p`;
    const url = `${normalizedBase}${m[0]}`;
    if (!found.some((s) => s.label === label)) {
      found.push({ label, url });
    }
  }
  const num = (label) => parseInt(label, 10) || 0;
  found.sort((a, b) => num(b.label) - num(a.label));
  return found;
}

/**
 * Parse categories list from /cats/ page HTML.
 * @param {string} html
 * @returns {Array<{slug: string, name: string}>}
 */
export function parseCategories(html) {
  if (typeof html !== 'string' || !html) return [];
  const cats = [];
  const re = /href="\/cat\/([^"/]+)\/"\s*title="([^"]*)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const slug = m[1];
    if (slug === 'all') continue;
    if (!cats.some((c) => c.slug === slug)) {
      cats.push({ slug, name: m[2] || slug.replace(/-/g, ' ') });
    }
  }
  return cats;
}

/**
 * Parse 'mb hdy' video blocks from an Eporner listing HTML page.
 * @param {string} html
 * @returns {{videos: Array, hasNext: boolean}}
 */
export function parseEpornerListing(html) {
  if (typeof html !== 'string' || !html) return { videos: [], hasNext: false };
  const videos = [];
  const parts = html.split('class="mb hdy"');
  for (let i = 1; i < parts.length; i++) {
    const blk = parts[i];
    const hrefMatch = blk.match(/href="\/(video-[^"/]+)\//);
    if (!hrefMatch) continue;
    const id = hrefMatch[1].replace(/^video-/, '');
    if (!id) continue;

    const titleMatch = blk.match(/<p class="mbtit">\s*<a[^>]*>([\s\S]*?)<\/a>/);
    const title = titleMatch
      ? titleMatch[1]
          .replace(/<[^>]+>/g, '')
          .replace(/&#0?39;/g, "'")
          .replace(/&amp;/g, '&')
          .trim()
      : id;

    const imgMatch = blk.match(/<img[^>]*>/);
    let thumb = '';
    if (imgMatch) {
      const imgTag = imgMatch[0];
      const dataSrc = imgTag.match(/data-src="([^"]+)"/);
      const src = imgTag.match(/src="([^"]+)"/);
      const raw = dataSrc ? dataSrc[1] : src ? src[1] : '';
      if (raw && !raw.startsWith('data:')) {
        thumb = safeHttpUrl(raw);
      }
    }

    const durMatch = blk.match(/<span class="mbtim"[^>]*>([^<]+)<\/span>/);
    const duration = durMatch ? durMatch[1].trim() : '';

    const viewsMatch = blk.match(/<span class="mbvie"[^>]*>([^<]+)<\/span>/);
    const views = viewsMatch ? parseFloat(viewsMatch[1].replace(/,/g, '')) || 0 : 0;

    videos.push({ id, slug: id, title, thumb, duration, source: 'eporner', views });
  }

  const hasNext = /rel="next"/.test(html);
  return { videos, hasNext };
}

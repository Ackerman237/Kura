/**
 * Kura HentaiTV Downloader
 * Attempts to extract direct stream URLs from hentai.tv embed player chain.
 * Strategy: fetch embedUrl HTML → regex scan for video source patterns.
 */

import { safeHttpUrl } from '../../security.js';
import { fetchHentaiHtml } from './client.js';
import { parseHentaiDetailHtml } from './parser.js';

const state = {
  baseUrl: process.env.HENTAI_BASE_URL || 'https://hentai.tv',
  userAgent:
    process.env.HENTAI_USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  timeoutMs: 20000,
};

/**
 * Scan an HTML string for common video source patterns.
 * @param {string} html
 * @param {string} [baseUrl]
 * @returns {Array<{label: string, url: string}>}
 */
function extractSourcesFromHtml(html, baseUrl = '') {
  if (!html) return [];
  const found = new Map();

  // Pattern 1: <source src="..." type="video/mp4" label="1080p">
  const srcTagRe = /<source[^>]+src="([^"]+)"[^>]*>/gi;
  let m;
  while ((m = srcTagRe.exec(html)) !== null) {
    const url = m[1].startsWith('http') ? m[1] : `${baseUrl}${m[1]}`;
    const safe = safeHttpUrl(url);
    if (!safe) continue;
    const qualityMatch = m[0].match(/label="(\d{3,4}p)"/i) || m[0].match(/res="(\d{3,4})"/i);
    const label = qualityMatch ? qualityMatch[1].replace(/^(\d+)$/, '$1p') : 'default';
    if (!found.has(label)) found.set(label, { label, url: safe });
  }

  // Pattern 2: file: "URL" or file: 'URL' (JW Player / Video.js)
  const fileRe = /file\s*:\s*["']([^"']+\.(?:mp4|m3u8|webm)[^"']*)["']/gi;
  while ((m = fileRe.exec(html)) !== null) {
    const url = m[1].startsWith('http') ? m[1] : `${baseUrl}${m[1]}`;
    const safe = safeHttpUrl(url);
    if (!safe || found.has(safe)) continue;
    const qm = url.match(/(\d{3,4})p/);
    const label = qm ? `${qm[1]}p` : 'stream';
    found.set(label, { label, url: safe });
  }

  // Pattern 3: sources: [{file: "...", label: "..."}] JSON-ish
  const jsonSourcesRe = /sources\s*:\s*\[([^\]]+)\]/gi;
  while ((m = jsonSourcesRe.exec(html)) !== null) {
    try {
      const arr = JSON.parse(`[${m[1].replace(/'/g, '"')}]`);
      for (const item of arr) {
        if (!item.file) continue;
        const safe = safeHttpUrl(item.file);
        if (!safe) continue;
        const label = item.label || item.res || 'stream';
        if (!found.has(label)) found.set(label, { label, url: safe });
      }
    } catch {
      // malformed JSON — skip
    }
  }

  // Sort by quality descending
  const result = [...found.values()];
  const num = (l) => parseInt(l, 10) || 0;
  result.sort((a, b) => num(b.label) - num(a.label));
  return result;
}

/**
 * Fetch the embed player URL for a given HentaiTV slug,
 * then extract direct video sources from the embed HTML.
 *
 * @param {string} slug - HentaiTV video slug
 * @returns {Promise<{sources: Array<{label:string,url:string}>, title: string, slug: string}>}
 */
export async function scrapeHentaiSources(slug) {
  if (!slug || typeof slug !== 'string') return { sources: [], title: '', slug };

  try {
    // Step 1: Get detail page to find embedUrl
    const detailHtml = await fetchHentaiHtml(`/hentai/${encodeURIComponent(slug)}`, state);
    const detail = parseHentaiDetailHtml(detailHtml, slug);
    const title = detail.title || slug;

    if (!detail.embedUrl) {
      return { sources: [], title, slug };
    }

    // Step 2: Fetch embed player page
    let embedHtml = null;
    try {
      const embedRes = await fetch(detail.embedUrl, {
        headers: {
          'User-Agent': state.userAgent,
          Referer: `${state.baseUrl}/`,
          Accept: 'text/html,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(state.timeoutMs),
      });
      if (embedRes.ok) embedHtml = await embedRes.text();
    } catch {
      // embed fetch failed
    }

    if (!embedHtml) return { sources: [], title, slug };

    // Step 3: Extract video sources from embed HTML
    const embedBase = (() => {
      try {
        const u = new URL(detail.embedUrl);
        return `${u.protocol}//${u.hostname}`;
      } catch {
        return '';
      }
    })();

    const sources = extractSourcesFromHtml(embedHtml, embedBase);
    return { sources, title, slug };
  } catch (err) {
    console.warn('[HentaiTV Downloader]', err.message);
    return { sources: [], title: slug, slug };
  }
}

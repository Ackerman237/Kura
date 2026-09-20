/**
 * Kura NekoPoi Downloader
 * Attempts to extract direct stream URLs from NekoPoi embed chain.
 * NekoPoi posts have multiple iframe players (streampoi, streamtape, doodstream, etc.)
 * Each provider has its own extraction strategy.
 */

import { safeHttpUrl } from '../../security.js';
import { fetchNekoHtml, DEFAULT_BASE_URL, DEFAULT_USER_AGENT } from './client.js';
import { parseDetail } from './parser.js';

const NEKO_CONFIG = {
  baseUrl: process.env.NEKO_BASE_URL || DEFAULT_BASE_URL,
  userAgent: process.env.NEKO_USER_AGENT || DEFAULT_USER_AGENT,
  timeoutMs: 25000,
  fetchImpl: globalThis.fetch,
};

const NEKO_UA =
  process.env.NEKO_USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

/**
 * Fetch embed player page with proper Referer.
 */
async function fetchEmbedHtml(url, referer) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': NEKO_UA,
        Referer: referer || url,
        Accept: 'text/html,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Extract sources from StreamTape embed.
 * StreamTape exposes robot.txt-style ID that can be resolved.
 */
function extractStreamtapeSources(html, embedUrl) {
  const m = html.match(/document\.getElementById\('norobotlink'\)\.innerHTML\s*=\s*["']([^"']+)["']/);
  if (!m) return [];
  const rawUrl = `https:${m[1].trim()}`;
  const safe = safeHttpUrl(rawUrl);
  if (!safe) return [];
  return [{ label: 'original', url: safe, host: 'streamtape' }];
}

/**
 * Extract sources from DoodStream embed.
 * DoodStream passes/tok through a redirect chain.
 */
async function extractDoodstreamSources(html, embedUrl) {
  const passMatch = html.match(/\/pass_md5\/[^'"]+/);
  if (!passMatch) return [];
  try {
    const base = new URL(embedUrl);
    const passUrl = `${base.protocol}//${base.hostname}${passMatch[0]}`;
    const res = await fetch(passUrl, {
      headers: { 'User-Agent': NEKO_UA, Referer: embedUrl },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const token = (await res.text()).trim();
    if (!token || !token.startsWith('http')) return [];
    const downloadUrl = `${token}?token=${Date.now()}&expiry=999999999`;
    const safe = safeHttpUrl(downloadUrl);
    if (!safe) return [];
    return [{ label: 'original', url: safe, host: 'doodstream' }];
  } catch {
    return [];
  }
}

/**
 * Generic scan — catches file/src patterns from JW Player, Video.js, etc.
 */
function genericExtract(html) {
  const found = [];

  // file: "URL" pattern
  const fileRe = /file\s*:\s*["']([^"']+\.(?:mp4|m3u8|webm)[^"']*)["']/gi;
  let m;
  while ((m = fileRe.exec(html)) !== null) {
    const safe = safeHttpUrl(m[1]);
    if (safe && !found.some((s) => s.url === safe)) {
      const qm = m[1].match(/(\d{3,4})p/);
      found.push({ label: qm ? `${qm[1]}p` : 'stream', url: safe, host: 'generic' });
    }
  }

  // <source src="..."> pattern
  const srcRe = /<source[^>]+src="([^"]+\.(?:mp4|m3u8)[^"]*)"[^>]*>/gi;
  while ((m = srcRe.exec(html)) !== null) {
    const safe = safeHttpUrl(m[1]);
    if (safe && !found.some((s) => s.url === safe)) {
      found.push({ label: 'stream', url: safe, host: 'generic' });
    }
  }

  return found;
}

/**
 * Per-host source extractor dispatcher.
 */
async function extractFromEmbed(embedUrl) {
  let host;
  try {
    host = new URL(embedUrl).hostname;
  } catch {
    return [];
  }

  const html = await fetchEmbedHtml(embedUrl, 'https://nekopoi.care/');
  if (!html) return [];

  if (host.includes('streamtape')) return extractStreamtapeSources(html, embedUrl);
  if (host.includes('dood')) return await extractDoodstreamSources(html, embedUrl);

  // Generic fallback for streampoi, playmogo, etc.
  return genericExtract(html);
}

/**
 * Scrape NekoPoi video sources for a given slug.
 * Tries each embed player in order, returns first successful set.
 *
 * @param {string} slug - NekoPoi video slug
 * @returns {Promise<{sources: Array<{label:string,url:string,host:string}>, title: string, players: string[]}>}
 */
export async function scrapeNekoSources(slug) {
  if (!slug || typeof slug !== 'string') return { sources: [], title: slug, players: [] };

  try {
    const detailHtml = await fetchNekoHtml(`/${encodeURIComponent(slug)}/`, NEKO_CONFIG);
    const detail = parseDetail(detailHtml, slug);
    const title = detail.title || slug;
    const players = detail.players || [];

    // Try players in order — return first set that yields results
    for (const playerUrl of players) {
      const sources = await extractFromEmbed(playerUrl);
      if (sources.length > 0) {
        return { sources, title, players };
      }
    }

    return { sources: [], title, players };
  } catch (err) {
    console.warn('[NekoPoi Downloader]', err.message);
    return { sources: [], title: slug, players: [] };
  }
}

// Hentai.tv Network Client
// Responsible for HTTP transport, headers, JSON API calls, and HTML page retrieval.

import {
  safeFetch,
  readTextLimited,
  readJsonLimited,
  MAX_RESPONSE_BYTES_HTML,
  MAX_RESPONSE_BYTES_JSON,
} from '../../http.js';

export const DEFAULT_BASE_URL = 'https://hentai.tv';
export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/**
 * Executes a GET request to retrieve and parse JSON from Hentai.tv API.
 * @param {string} path - Target path (e.g. '/api/browse?page=1')
 * @param {object} config - Configuration object (baseUrl, userAgent, timeoutMs, fetchImpl)
 * @returns {Promise<any>}
 */
export async function fetchHentaiJson(path, config) {
  const normalizedBase = config.baseUrl.replace(/\/+$/, '');
  const url = `${normalizedBase}${path.startsWith('/') ? '' : '/'}${path}`;

  const res = await safeFetch(
    url,
    {
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(config.timeoutMs),
    },
    { fetchImpl: config.fetchImpl }
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${path}`);
  }

  return readJsonLimited(res, MAX_RESPONSE_BYTES_JSON);
}

/**
 * Executes a GET request to retrieve raw HTML from Hentai.tv.
 * @param {string} path - Target path (e.g. '/hentai/slug')
 * @param {object} config - Configuration object
 * @returns {Promise<string>}
 */
export async function fetchHentaiHtml(path, config) {
  const normalizedBase = config.baseUrl.replace(/\/+$/, '');
  const url = `${normalizedBase}${path.startsWith('/') ? '' : '/'}${path}`;

  const res = await safeFetch(
    url,
    {
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(config.timeoutMs),
    },
    { fetchImpl: config.fetchImpl }
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${path}`);
  }

  return readTextLimited(res, MAX_RESPONSE_BYTES_HTML);
}

/**
 * Requests the /random endpoint without following redirect to capture the target slug from Location header.
 * @param {object} config
 * @returns {Promise<string>}
 */
export async function fetchHentaiRandomRedirect(config) {
  const normalizedBase = config.baseUrl.replace(/\/+$/, '');
  const url = `${normalizedBase}/random`;

  const res = await safeFetch(
    url,
    {
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(config.timeoutMs),
    },
    { fetchImpl: config.fetchImpl, followRedirects: false }
  );

  const location = res.headers.get('location') || '';
  const m = location.match(/\/hentai\/([a-z0-9-]+)/);
  return m ? m[1] : '';
}

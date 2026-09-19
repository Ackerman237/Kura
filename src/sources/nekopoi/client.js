// NekoPoi Network Client
// Responsible for HTTP transport, headers, and retrieving raw HTML.

import { safeFetch, readTextLimited, MAX_RESPONSE_BYTES_HTML } from '../../http.js';

export const DEFAULT_BASE_URL = 'https://nekopoi.care';
export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

/**
 * Executes a GET request to retrieve raw HTML from NekoPoi.
 * @param {string} path - Target path (e.g. '/page/2/')
 * @param {object} config - Configuration object (baseUrl, userAgent, timeoutMs, fetchImpl)
 * @returns {Promise<string>} Raw HTML string
 */
export async function fetchNekoHtml(path, config) {
  const normalizedBase = config.baseUrl.replace(/\/+$/, '');
  const url = `${normalizedBase}${path.startsWith('/') ? '' : '/'}${path}`;

  const res = await safeFetch(
    url,
    {
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
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

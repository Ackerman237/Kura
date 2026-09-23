// Eporner Network Client
// Responsible for HTTP transport through proxy pool, headers, and validation.

import { fetchThroughProxy, validators } from '../../proxy.js';
import {
  readJsonLimited,
  readTextLimited,
  MAX_RESPONSE_BYTES_JSON,
  MAX_RESPONSE_BYTES_HTML,
} from '../../http.js';

export const DEFAULT_API_BASE = 'https://www.eporner.com/api/v2';
export const DEFAULT_HTML_BASE = 'https://www.eporner.com';
export const REFERER = 'https://www.eporner.com/';
export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/**
 * Fetch JSON payload from Eporner API through proxy pool with content validation.
 * @param {string} url - Full target URL
 * @param {object} config - Configuration object
 * @returns {Promise<any>}
 */
export async function fetchEpornerJson(url, config) {
  const res = await fetchThroughProxy(
    url,
    {
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'application/json',
        Referer: REFERER,
      },
      signal: AbortSignal.timeout(config.timeoutMs),
    },
    { validate: validators.json }
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  return readJsonLimited(res, MAX_RESPONSE_BYTES_JSON);
}

/**
 * Fetch HTML page from Eporner through proxy pool with HTML validator.
 * @param {string} url - Full target URL
 * @param {object} config - Configuration object
 * @returns {Promise<string>}
 */
export async function fetchEpornerHtml(url, config) {
  const isVideoPage = url.includes('/video-');
  const res = await fetchThroughProxy(
    url,
    {
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: REFERER,
        Cookie: 'age_verified=1; age_confirmed=1; warn=1; epsamples=1',
      },
      signal: AbortSignal.timeout(config.timeoutMs),
    },
    {
      validate: isVideoPage
        ? async (r) => {
            const text = (await r.text()).toLowerCase();
            return text.includes('eporner') && text.includes('/dload/');
          }
        : validators.html('eporner'),
    }
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  return readTextLimited(res, MAX_RESPONSE_BYTES_HTML);
}

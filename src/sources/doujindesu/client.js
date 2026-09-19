// Doujindesu Network Client
// Responsible for HTTP transport, origin validation, auth headers, and network payload fetching.

import { safeFetch, readTextLimited, MAX_RESPONSE_BYTES_JSON } from '../../http.js';
import { decryptResponse } from './crypto.js';

export const DEFAULT_BASE_URL = 'https://doujin.desu.xxx';
export const DEFAULT_TRUSTED_HOSTS = new Set(['doujin.desu.xxx']);
export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/**
 * Validates that baseUrl conforms to HTTPS, trusted origins, and standard port.
 * @param {string} rawUrl
 * @param {Set<string>} [trustedHosts=DEFAULT_TRUSTED_HOSTS]
 * @returns {string} Normalized origin
 */
export function validateBaseUrl(rawUrl, trustedHosts = DEFAULT_TRUSTED_HOSTS) {
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
 * Generates an ephemeral pseudo-random device ID.
 * @returns {string}
 */
export function deviceId() {
  return 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
}

/**
 * Builds isolated authentication headers.
 * Secrets are ONLY attached if the target matches the trusted baseUrl origin.
 * @param {object} params
 * @param {string} params.targetUrl
 * @param {string} params.baseUrl
 * @param {Set<string>} params.trustedHosts
 * @param {string} params.appSecret
 * @returns {Record<string, string>}
 */
export function buildAuthHeaders({ targetUrl, baseUrl, trustedHosts, appSecret }) {
  const targetParsed = new URL(targetUrl);
  const baseParsed = new URL(baseUrl);
  const headers = {
    'x-device-id': deviceId(),
    'x-device-name': 'Desktop',
  };
  if (
    targetParsed.origin === baseParsed.origin &&
    trustedHosts.has(targetParsed.hostname.toLowerCase())
  ) {
    if (appSecret) {
      headers['X-App-Secret'] = appSecret;
      headers['x-app-secret'] = appSecret;
    }
  }
  return headers;
}

/**
 * Executes a GET request to the Doujindesu API, handles decryption, and returns parsed JSON.
 * @param {string} path - API endpoint path (e.g. '/manga?limit=24')
 * @param {object} config - Client configuration object
 * @returns {Promise<any>} Parsed response data
 */
export async function fetchDoujinApi(path, config) {
  const targetUrl = buildSourceUrl(config.baseUrl, path);
  const authHeaders = buildAuthHeaders({
    targetUrl: targetUrl.href,
    baseUrl: config.baseUrl,
    trustedHosts: config.trustedHosts,
    appSecret: config.appSecret,
  });

  const res = await safeFetch(
    targetUrl.href,
    {
      headers: {
        'User-Agent': config.userAgent,
        Accept: 'application/json',
        ...authHeaders,
      },
      signal: AbortSignal.timeout(config.timeoutMs),
    },
    { fetchImpl: config.fetchImpl }
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${path}`);
  }

  const text = await readTextLimited(res, MAX_RESPONSE_BYTES_JSON);
  if (text.includes('_enc_resp_')) {
    const rawObj = JSON.parse(text);
    return decryptResponse(rawObj._enc_resp_, config.salt);
  }
  return JSON.parse(text);
}

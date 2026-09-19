import { Agent, fetch as undiciFetch } from 'undici';
import { isSafeExternalUrl, looksLikeIp } from './security.js';

export const MAX_REDIRECTS = 5;
export const MAX_RESPONSE_BYTES_HTML = 5 * 1024 * 1024; // 5 MB
export const MAX_RESPONSE_BYTES_JSON = 2 * 1024 * 1024; // 2 MB
const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-app-secret'];

export class UnsafeUrlError extends Error {
  constructor(message = 'URL tidak diizinkan atau tidak aman') {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

export class ResponseTooLargeError extends Error {
  constructor(maxBytes) {
    super(`Response melebihi batas ${maxBytes} byte`);
    this.name = 'ResponseTooLargeError';
    this.maxBytes = maxBytes;
  }
}

/**
 * Membuat custom undici Agent dengan socket-level DNS verification (Anti DNS Rebinding).
 * @param {Function} [customLookup]
 * @returns {Agent}
 */
export function createSafeDispatcher(customLookup) {
  return new Agent({
    connect: {
      lookup(hostname, opts, cb) {
        const lookupFn =
          customLookup ||
          (async (h, o) => {
            const { lookup } = await import('node:dns/promises');
            return lookup(h, o);
          });

        Promise.resolve()
          .then(() => lookupFn(hostname, opts))
          .then((res) => {
            const list = Array.isArray(res) ? res : [res];
            for (const item of list) {
              const ip = typeof item === 'string' ? item : item?.address;
              if (!ip || looksLikeIp(ip)) {
                return cb(new Error(`DNS Rebinding dicegah: IP ${ip} tidak diizinkan`));
              }
            }
            if (Array.isArray(res)) {
              cb(null, res);
            } else {
              cb(null, res.address, res.family);
            }
          })
          .catch((err) => cb(err));
      },
    },
  });
}

const defaultSafeDispatcher = createSafeDispatcher();

function parseUrl(value, base) {
  try {
    return new URL(value, base);
  } catch {
    throw new UnsafeUrlError(`URL tidak valid: "${value}"`);
  }
}

/**
 * Melakukan HTTP request dengan penanganan redirect manual dan validasi SSRF tiap hop.
 * Mengamankan koneksi dari serangan DNS Rebinding / TOCTOU via socket-level dispatcher.
 * @param {string|URL} input - URL target awal
 * @param {RequestInit} [init] - fetch options
 * @param {object} [deps] - dependency injection untuk testing/mocking
 * @param {Function} [deps.fetchImpl] - implementasi fetch
 * @param {Function} [deps.validate] - fungsi validasi keamanan URL (default: isSafeExternalUrl)
 * @param {number} [deps.maxRedirects] - batas maksimal hop redirect (default: 5)
 * @param {boolean} [deps.followRedirects] - apakah mengikuti redirect (default: true)
 * @param {object} [deps.dispatcher] - dispatcher kustom undici
 * @param {Function} [deps.dnsLookup] - fungsi resolver DNS kustom untuk pengujian
 * @returns {Promise<Response>}
 */
export async function safeFetch(input, init = {}, deps = {}) {
  const {
    fetchImpl,
    validate = isSafeExternalUrl,
    maxRedirects = MAX_REDIRECTS,
    followRedirects = true,
    dispatcher,
    dnsLookup,
  } = deps;

  const activeDispatcher =
    dispatcher || (dnsLookup ? createSafeDispatcher(dnsLookup) : defaultSafeDispatcher);

  const actualFetch =
    fetchImpl || ((url, opts) => undiciFetch(url, { ...opts, dispatcher: activeDispatcher }));

  let current = parseUrl(input);
  let options = { ...init, redirect: 'manual' };

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const isSafe = await validate(current.href, { dnsLookup });
    if (!isSafe) {
      throw new UnsafeUrlError(`URL tidak aman: ${current.href}`);
    }

    let res;
    try {
      res = await actualFetch(current.href, options);
    } catch (err) {
      const causeMsg = err?.cause?.message || err?.message || '';
      if (/DNS Rebinding|tidak diizinkan|Blocked IP/i.test(causeMsg)) {
        throw new UnsafeUrlError(causeMsg);
      }
      throw err;
    }

    if (!REDIRECT_STATUS.has(res.status) || !followRedirects) {
      return res;
    }

    // Tangani redirect
    const location = res.headers.get('location');
    await res.body?.cancel().catch(() => {});

    if (!location) {
      throw new Error(`Redirect status ${res.status} tanpa header Location`);
    }

    if (hop === maxRedirects) {
      throw new Error(`Terlalu banyak redirect (maksimal ${maxRedirects} hop)`);
    }

    const next = parseUrl(location, current);

    // Cegah downgrade protokol https -> http
    if (current.protocol === 'https:' && next.protocol === 'http:') {
      throw new UnsafeUrlError(`Downgrade https ke http diblokir: ${current.href} -> ${next.href}`);
    }

    // Buang header sensitif jika berpindah origin
    if (next.origin !== current.origin) {
      const headers = new Headers(options.headers);
      for (const name of SENSITIVE_HEADERS) {
        headers.delete(name);
      }
      options = { ...options, headers };
    }

    // Sesuaikan method HTTP pada redirect
    const method = (options.method || 'GET').toUpperCase();
    if (res.status === 303 || ((res.status === 301 || res.status === 302) && method === 'POST')) {
      options = { ...options, method: 'GET', body: undefined };
    }

    current = next;
  }

  throw new Error(`Terlalu banyak redirect (maksimal ${maxRedirects} hop)`);
}

/**
 * Membaca body response sebagai teks UTF-8 dengan batas ukuran byte maksimum.
 * Menolak lebih awal jika Content-Length melebihi batas, dan memutus stream jika byte terkumpul melebihi batas.
 * @param {Response} res
 * @param {number} [maxBytes]
 * @returns {Promise<string>}
 */
export async function readTextLimited(res, maxBytes = MAX_RESPONSE_BYTES_HTML) {
  const declared = Number(res.headers?.get?.('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await res.body?.cancel().catch(() => {});
    throw new ResponseTooLargeError(maxBytes);
  }
  if (!res.body) return '';

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let received = 0;
  let text = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new ResponseTooLargeError(maxBytes);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text;
  } catch (err) {
    await reader.cancel().catch(() => {});
    throw err;
  }
}

/**
 * Membaca body response sebagai JSON dengan batas ukuran byte maksimum.
 * @param {Response} res
 * @param {number} [maxBytes]
 * @returns {Promise<any>}
 */
export async function readJsonLimited(res, maxBytes = MAX_RESPONSE_BYTES_JSON) {
  const text = await readTextLimited(res, maxBytes);
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Gagal mem-parse JSON response: ${err.message}`);
  }
}

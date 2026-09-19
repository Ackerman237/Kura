// Shared security utilities: external-URL validation (anti-SSRF), HTML/URL
// sanitization. Everything a scraper returns that originated from a third
// party should pass through these before being rendered by your UI.

const PRIVATE_IP_RE =
  /^(0\.|10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|100\.(6[4-9]|[7-9]\d)|198\.18\.|198\.19\.)/;
const IPV6_PRIVATE_RE =
  /^(::1$|::|fe80:|fc00:|fd00:|fec0:|2001:db8:|::ffff:)/i;
export const LOCAL_HOSTNAMES = new Set([
  'localhost',
  'local',
  'metadata.google.internal',
  'metadata',
]);

export function looksLikeIp(hostname) {
  const cleaned = hostname.replace(/^\[|\]$/g, '');
  // IPv6 literal
  if (cleaned.includes(':')) {
    return IPV6_PRIVATE_RE.test(cleaned);
  }
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(cleaned)) {
    return PRIVATE_IP_RE.test(cleaned) || cleaned === '0.0.0.0';
  }
  return false;
}

/**
 * Reject URLs pointing to internal resources (SSRF protection): local
 * hostnames, private/loopback/link-local IPs, or DNS resolutions to those
 * IPs. Non-standard ports (anything other than 80/443) are also rejected.
 *
 * Note: performs a DNS lookup via node:dns — only available in Node.js
 * runtimes (not browsers/edge workers).
 *
 * @param {string} rawUrl
 * @param {{allowPorts?: number[], dnsLookup?: Function}} [opts]
 * @returns {Promise<boolean>}
 */
export async function isSafeExternalUrl(rawUrl, { allowPorts = [80, 443], dnsLookup } = {}) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.username || url.password) return false;

  const port = url.port || (url.protocol === 'https:' ? '443' : '80');
  if (!allowPorts.includes(Number(port))) return false;

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (LOCAL_HOSTNAMES.has(hostname)) return false;
  if (looksLikeIp(hostname)) return false;

  // DNS rebinding protection: make sure the resolved address is not internal.
  try {
    const lookupFn = dnsLookup || (await import('node:dns/promises')).lookup;
    const addresses = await lookupFn(hostname, { all: true });
    const list = Array.isArray(addresses) ? addresses : [addresses];
    if (list.some((a) => looksLikeIp(typeof a === 'string' ? a : a.address))) return false;
  } catch {
    // DNS resolution failed — fail closed.
    return false;
  }

  return true;
}

/** Strip javascript:, data:, vbscript: and similar dangerous schemes. */
const ALLOWED_SCHEMES = new Set(['http', 'https']);
const CONTROL_CHARS = /\p{Cc}/gu;
const SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):/i;

/**
 * Membersihkan URL sebelum dirender atau disimpan.
 * - Membuang control character (tab, newline, null, dll.), seperti browser.
 * - Menolak skema selain http/https.
 * - URL relatif dan protocol-relative (//host/path) dikembalikan apa adanya.
 *
 * BUKAN perlindungan SSRF. Untuk request keluar, gunakan isSafeExternalUrl().
 *
 * @param {unknown} input
 * @returns {string} URL yang sudah dibersihkan, atau '' jika ditolak
 */
export function sanitizeUrl(input) {
  if (typeof input !== 'string') return '';

  const cleaned = input.replace(CONTROL_CHARS, '').trim();
  const match = SCHEME_PATTERN.exec(cleaned);

  if (match && !ALLOWED_SCHEMES.has(match[1].toLowerCase())) return '';

  return cleaned;
}

/**
 * Remove HTML tags and normalize whitespace — for text that originated from
 * an external source.
 * @param {string} raw
 * @returns {string}
 */
export function stripHtml(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Safe URL for href/src attributes — forces http/https only, returns '' for
 * anything else (javascript:, data:, vbscript:, relative paths, garbage).
 * @param {string} rawUrl
 * @returns {string}
 */
export function safeHttpUrl(rawUrl) {
  const cleaned = sanitizeUrl(rawUrl);
  if (!cleaned) return '';
  try {
    const url = new URL(cleaned);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  } catch {
    return '';
  }
}

export class InvalidInputError extends Error {
  constructor(message = 'Input tidak valid') {
    super(message);
    this.name = 'InvalidInputError';
  }
}

const SLUG_START_RE = /^[a-zA-Z0-9\p{L}\p{N}]/u;
const SLUG_CHARS_RE = /^[a-zA-Z0-9\p{L}\p{N}\-_.~()\[\]]+$/u;

/**
 * Validasi slug agar aman untuk URL path / cache key tanpa memutus format nyata.
 * Menolak traversal (..), delimiter path (/ dan \), query (?), fragment (#), %2f, dan control chars.
 * @param {unknown} value
 * @param {string} [name='slug']
 * @param {{maxLength?: number}} [opts]
 * @returns {string}
 */
export function assertSlug(value, name = 'slug', { maxLength = 200 } = {}) {
  if (typeof value !== 'string') {
    throw new InvalidInputError(`${name} harus string`);
  }
  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed.length > maxLength ||
    !SLUG_START_RE.test(trimmed) ||
    !SLUG_CHARS_RE.test(trimmed) ||
    trimmed.includes('..') ||
    /%2[fe]/i.test(trimmed) ||
    /%5[cd]/i.test(trimmed)
  ) {
    throw new InvalidInputError(`${name} tidak valid`);
  }
  return trimmed;
}

/**
 * Validasi integer (misal page, limit).
 * @param {unknown} value
 * @param {{min?: number, max?: number, name?: string, defaultValue?: number}} opts
 * @returns {number}
 */
export function assertInt(value, { min = 1, max = 1000, name = 'value', defaultValue } = {}) {
  if (value === undefined && defaultValue !== undefined) {
    return defaultValue;
  }
  const n = typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? Number(value.trim()) : value;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
    throw new InvalidInputError(`${name} harus integer ${min}-${max}`);
  }
  return n;
}

/**
 * Validasi query pencarian (control characters dibuang, batas panjang).
 * @param {unknown} value
 * @param {{minLength?: number, maxLength?: number, name?: string}} [opts]
 * @returns {string}
 */
export function assertQuery(value, { minLength = 1, maxLength = 100, name = 'query' } = {}) {
  if (typeof value !== 'string') {
    throw new InvalidInputError(`${name} harus string`);
  }
  const cleaned = value.replace(CONTROL_CHARS, '').trim();
  if (cleaned.length < minLength || cleaned.length > maxLength) {
    throw new InvalidInputError(`${name} kosong atau terlalu panjang`);
  }
  return cleaned;
}


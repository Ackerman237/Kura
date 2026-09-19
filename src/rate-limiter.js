// Rate limiting & anti-abuse module for self-hosted-manga-reader.
// Framework-agnostic, zero external dependencies.
// Provides:
//   1. Inbound Rate Limiting (Client API protection: sliding-window, LRU memory-bounded, Connect/Express & Web Fetch handlers)
//   2. Outbound Upstream Throttling (Scraper pacing, per-origin concurrency control, and 429 backoff)

const DEFAULT_WINDOW_MS = 60 * 1000; // 1 menit
const DEFAULT_MAX = 60; // 60 request per jendela waktu
const DEFAULT_MAX_KEYS = 10_000; // Maksimal 10.000 IP/klien unik dalam memori untuk mencegah memory exhaustion

/**
 * Ekstraksi identitas klien (IP) dari request object.
 * Mendukung Cloudflare (CF-Connecting-IP), X-Forwarded-For, dan fallback socket IP.
 * @param {object} req
 * @returns {string}
 */
export function getClientIp(req) {
  if (!req) return 'unknown';

  // Standar Cloudflare
  const cfIp = typeof req.get === 'function' ? req.get('cf-connecting-ip') : req.headers?.['cf-connecting-ip'];
  if (cfIp && typeof cfIp === 'string') return cfIp.trim();

  // X-Forwarded-For (ambil IP pertama pengunjung asli sebelum proxy/load balancer)
  const xForwarded = typeof req.get === 'function' ? req.get('x-forwarded-for') : req.headers?.['x-forwarded-for'];
  if (xForwarded && typeof xForwarded === 'string') {
    const first = xForwarded.split(',')[0].trim();
    if (first) return first;
  }

  // Fallback Express/Node HTTP socket
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Memory-bounded sliding window rate limiter.
 * Menggunakan Map dengan eviksi LRU saat jumlah key mencapai maxKeys.
 */
export class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || DEFAULT_WINDOW_MS;
    this.max = options.max || DEFAULT_MAX;
    this.maxKeys = options.maxKeys || DEFAULT_MAX_KEYS;
    this.keyGenerator = options.keyGenerator || getClientIp;
    this.message = options.message || {
      success: false,
      message: 'Terlalu banyak permintaan. Coba lagi sebentar.',
    };

    // Map: key -> Array of timestamps
    this.store = new Map();
  }

  /**
   * Mengonsumsi 1 token request untuk key tertentu.
   * @param {string} key
   * @param {number} [now]
   * @returns {{ allowed: boolean, remaining: number, resetTime: number, retryAfter: number, totalHits: number }}
   */
  consume(key, now = Date.now()) {
    const cleanKey = String(key || 'unknown');
    const windowStart = now - this.windowMs;

    let hits = this.store.get(cleanKey);
    if (!hits) {
      // Jaga batas memori: buang entri terlama jika mencapai maxKeys
      if (this.store.size >= this.maxKeys) {
        const oldestKey = this.store.keys().next().value;
        if (oldestKey !== undefined) this.store.delete(oldestKey);
      }
      hits = [];
    } else {
      // Re-insert untuk mempertahankan urutan LRU
      this.store.delete(cleanKey);
    }

    // Bersihkan hit di luar rentang jendela geser
    const validHits = hits.filter((t) => t > windowStart);

    const allowed = validHits.length < this.max;
    if (allowed) {
      validHits.push(now);
    }

    this.store.set(cleanKey, validHits);

    const oldest = validHits[0] || now;
    const resetTime = oldest + this.windowMs;
    const remaining = Math.max(0, this.max - validHits.length);
    const retryAfter = allowed ? 0 : Math.max(1, Math.ceil((resetTime - now) / 1000));

    return {
      allowed,
      remaining,
      resetTime,
      retryAfter,
      totalHits: validHits.length,
    };
  }

  /**
   * Reset kuota untuk key tertentu.
   * @param {string} key
   */
  reset(key) {
    this.store.delete(String(key));
  }

  /**
   * Mengosongkan seluruh riwayat rate limiter.
   */
  clear() {
    this.store.clear();
  }

  /**
   * Jumlah key aktif dalam memori.
   * @returns {number}
   */
  get size() {
    return this.store.size;
  }

  /**
   * Middleware standar untuk Connect / Express.
   * @returns {Function} (req, res, next)
   */
  middleware() {
    return (req, res, next) => {
      const key = this.keyGenerator(req);
      const result = this.consume(key);

      res.setHeader('X-RateLimit-Limit', this.max);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter);
        res.status(429);
        return res.json(this.message);
      }

      next();
    };
  }

  /**
   * Handler untuk standar Web Request / Fetch API (misal Next.js route, Bun, Cloudflare Workers).
   * @param {Request|object} req
   * @returns {Response|null} Mengembalikan Response HTTP 429 jika diblokir, atau null jika lolos.
   */
  handleWebRequest(req) {
    const key = this.keyGenerator(req);
    const result = this.consume(key);

    if (!result.allowed) {
      const body = typeof this.message === 'string' ? this.message : JSON.stringify(this.message);
      return new Response(body, {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(this.max),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
          'Retry-After': String(result.retryAfter),
        },
      });
    }

    return null;
  }
}

/**
 * Pengatur ritme request keluar (Outbound Upstream Throttler).
 * Mencegah pemblokiran IP oleh server upstream akibat request serentak yang terlalu rapat.
 */
export class UpstreamThrottler {
  constructor(options = {}) {
    this.minIntervalMs = options.minIntervalMs || 250; // Jeda minimal antar request ke host yang sama
    this.maxConcurrent = options.maxConcurrent || 3; // Maksimal request serentak per host
    this.hostState = new Map(); // host -> { active: number, lastRequestAt: number, queue: Array<Function>, cooldownUntil: number }
  }

  _getState(host) {
    let state = this.hostState.get(host);
    if (!state) {
      if (this.hostState.size >= 500) {
        const oldest = this.hostState.keys().next().value;
        if (oldest !== undefined) this.hostState.delete(oldest);
      }
      state = {
        active: 0,
        lastRequestAt: 0,
        queue: [],
        cooldownUntil: 0,
      };
      this.hostState.set(host, state);
    }
    return state;
  }

  /**
   * Set cooldown sementara jika server upstream merespons 429 Too Many Requests.
   * @param {string} hostOrUrl
   * @param {number} cooldownMs
   */
  setCooldown(hostOrUrl, cooldownMs = 10_000) {
    const host = this._extractHost(hostOrUrl);
    const state = this._getState(host);
    state.cooldownUntil = Date.now() + cooldownMs;
  }

  _extractHost(hostOrUrl) {
    try {
      if (hostOrUrl.includes('://')) {
        return new URL(hostOrUrl).hostname.toLowerCase();
      }
    } catch {}
    return String(hostOrUrl).toLowerCase();
  }

  /**
   * Menjalankan fungsi fetch/request dengan pembatasan interval dan konkurensi per host.
   * @template T
   * @param {string} hostOrUrl
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async throttle(hostOrUrl, fn) {
    const host = this._extractHost(hostOrUrl);
    const state = this._getState(host);

    await this._acquire(state);

    try {
      return await fn();
    } finally {
      this._release(state);
    }
  }

  async _acquire(state) {
    const now = Date.now();
    if (state.cooldownUntil > now) {
      const waitTime = state.cooldownUntil - now;
      await new Promise((r) => setTimeout(r, waitTime));
    }

    if (state.active >= this.maxConcurrent) {
      await new Promise((resolve) => state.queue.push(resolve));
    }

    const elapsed = Date.now() - state.lastRequestAt;
    if (elapsed < this.minIntervalMs) {
      await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed));
    }

    state.active++;
    state.lastRequestAt = Date.now();
  }

  _release(state) {
    state.active = Math.max(0, state.active - 1);
    if (state.queue.length > 0) {
      const nextResolve = state.queue.shift();
      nextResolve();
    }
  }

  clear() {
    this.hostState.clear();
  }
}

// ── Preset Limiters ──────────────────────────────────────────────────────────

/** Rate limiter untuk request umum API (60 req/menit per IP) */
export const generalLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: { success: false, message: 'Terlalu banyak permintaan API. Coba lagi sebentar.' },
});

/** Rate limiter untuk endpoint pencarian yang lebih berat (30 req/menit per IP) */
export const searchLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Terlalu banyak pencarian. Coba lagi sebentar.' },
});

/** Rate limiter untuk proxy gambar / stream chapter (180 req/menit per IP) */
export const imageProxyLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  max: 180,
  message: { success: false, message: 'Terlalu banyak permintaan gambar. Coba lagi sebentar.' },
});

/** Throttler global untuk request upstream scraper */
export const upstreamThrottler = new UpstreamThrottler();

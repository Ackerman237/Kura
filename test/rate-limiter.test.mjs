import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  RateLimiter,
  UpstreamThrottler,
  getClientIp,
  generalLimiter,
  searchLimiter,
  imageProxyLimiter,
} from '../src/rate-limiter.js';

describe('RateLimiter & Anti-Abuse (Client Inbound)', () => {
  test('mengizinkan request dalam batas kuota dan menolak jika melebihi batas', () => {
    const limiter = new RateLimiter({ windowMs: 1000, max: 3 });
    const ip = '198.51.100.1';

    const r1 = limiter.consume(ip);
    assert.equal(r1.allowed, true);
    assert.equal(r1.remaining, 2);

    const r2 = limiter.consume(ip);
    assert.equal(r2.allowed, true);
    assert.equal(r2.remaining, 1);

    const r3 = limiter.consume(ip);
    assert.equal(r3.allowed, true);
    assert.equal(r3.remaining, 0);

    const r4 = limiter.consume(ip);
    assert.equal(r4.allowed, false);
    assert.equal(r4.remaining, 0);
    assert.ok(r4.retryAfter > 0);
  });

  test('mengisolasi kuota antar-IP berbeda', () => {
    const limiter = new RateLimiter({ windowMs: 1000, max: 2 });
    limiter.consume('1.1.1.1');
    limiter.consume('1.1.1.1');
    assert.equal(limiter.consume('1.1.1.1').allowed, false);

    // IP lain masih punya kuota penuh
    assert.equal(limiter.consume('2.2.2.2').allowed, true);
    assert.equal(limiter.consume('2.2.2.2').allowed, true);
  });

  test('kuota pulih setelah jendela geser (sliding window) kedaluwarsa', () => {
    const limiter = new RateLimiter({ windowMs: 100, max: 1 });
    const ip = '1.2.3.4';
    const now = 1_000_000;

    assert.equal(limiter.consume(ip, now).allowed, true);
    assert.equal(limiter.consume(ip, now + 10).allowed, false);

    // Setelah 101ms (lewat window 100ms), pulih kembali
    assert.equal(limiter.consume(ip, now + 101).allowed, true);
  });

  test('menjaga batas memori (maxKeys) dengan eviksi LRU', () => {
    const limiter = new RateLimiter({ windowMs: 1000, max: 5, maxKeys: 3 });

    limiter.consume('ip-1');
    limiter.consume('ip-2');
    limiter.consume('ip-3');
    assert.equal(limiter.size, 3);

    // Akses ip-1 lagi agar menjadi recent
    limiter.consume('ip-1');

    // Tambah ip-4: karena kapasitas 3, ip-2 (paling lama tidak diakses) harus dibuang
    limiter.consume('ip-4');
    assert.equal(limiter.size, 3);

    // ip-1 dan ip-4 masih ada di store
    assert.ok(limiter.store.has('ip-1'));
    assert.ok(limiter.store.has('ip-4'));
    assert.equal(limiter.store.has('ip-2'), false);
  });

  test('reset dan clear bekerja dengan benar', () => {
    const limiter = new RateLimiter({ windowMs: 1000, max: 1 });
    limiter.consume('test-ip');
    assert.equal(limiter.consume('test-ip').allowed, false);

    limiter.reset('test-ip');
    assert.equal(limiter.consume('test-ip').allowed, true);

    limiter.consume('ip-a');
    limiter.consume('ip-b');
    assert.ok(limiter.size > 0);
    limiter.clear();
    assert.equal(limiter.size, 0);
  });
});

describe('getClientIp', () => {
  test('memprioritaskan header CF-Connecting-IP dari Cloudflare', () => {
    const req = {
      get(header) {
        if (header.toLowerCase() === 'cf-connecting-ip') return '203.0.113.195';
        if (header.toLowerCase() === 'x-forwarded-for') return '10.0.0.1, 10.0.0.2';
        return undefined;
      },
      ip: '127.0.0.1',
    };
    assert.equal(getClientIp(req), '203.0.113.195');
  });

  test('mengambil IP pertama dari header X-Forwarded-For jika tanpa Cloudflare', () => {
    const req = {
      headers: {
        'x-forwarded-for': '198.51.100.44, 10.0.0.1',
      },
      ip: '127.0.0.1',
    };
    assert.equal(getClientIp(req), '198.51.100.44');
  });

  test('fallback ke req.ip atau socket remoteAddress', () => {
    const req1 = { ip: '192.0.2.1' };
    assert.equal(getClientIp(req1), '192.0.2.1');

    const req2 = { socket: { remoteAddress: '192.0.2.2' } };
    assert.equal(getClientIp(req2), '192.0.2.2');

    assert.equal(getClientIp(null), 'unknown');
  });
});

describe('RateLimiter Middleware & Web Handlers', () => {
  test('middleware Express/Connect memanggil next() saat lolos dan menetapkan header', () => {
    const limiter = new RateLimiter({ windowMs: 1000, max: 2 });
    const mw = limiter.middleware();

    const headers = {};
    const req = { ip: '10.10.10.10' };
    const res = {
      setHeader(k, v) {
        headers[k] = v;
      },
      status() {},
      json() {},
    };

    let called = false;
    mw(req, res, () => {
      called = true;
    });

    assert.equal(called, true);
    assert.equal(headers['X-RateLimit-Limit'], 2);
    assert.equal(headers['X-RateLimit-Remaining'], 1);
  });

  test('middleware Express/Connect merespons 429 saat kuota terlampaui', () => {
    const limiter = new RateLimiter({ windowMs: 1000, max: 1 });
    const mw = limiter.middleware();

    const headers = {};
    let statusCode = 200;
    let responseBody = null;

    const req = { ip: '10.10.10.20' };
    const res = {
      setHeader(k, v) {
        headers[k] = v;
      },
      status(c) {
        statusCode = c;
      },
      json(b) {
        responseBody = b;
      },
    };

    // Panggilan pertama lolos
    mw(req, res, () => {});
    assert.equal(statusCode, 200);

    // Panggilan kedua terblokir
    let secondCalled = false;
    mw(req, res, () => {
      secondCalled = true;
    });

    assert.equal(secondCalled, false);
    assert.equal(statusCode, 429);
    assert.equal(headers['X-RateLimit-Remaining'], 0);
    assert.ok(headers['Retry-After'] > 0);
    assert.equal(responseBody.success, false);
  });

  test('handleWebRequest mengembalikan null jika lolos dan Response 429 jika diblokir', () => {
    const limiter = new RateLimiter({ windowMs: 1000, max: 1 });
    const req = { ip: '10.10.10.30' };

    const first = limiter.handleWebRequest(req);
    assert.equal(first, null);

    const second = limiter.handleWebRequest(req);
    assert.ok(second instanceof Response);
    assert.equal(second.status, 429);
    assert.equal(second.headers.get('X-RateLimit-Remaining'), '0');
    assert.ok(Number(second.headers.get('Retry-After')) > 0);
  });
});

describe('UpstreamThrottler (Outbound Scraper Anti-Abuse)', () => {
  test('membatasi interval minimal antar request ke host yang sama', async () => {
    const throttler = new UpstreamThrottler({ minIntervalMs: 30, maxConcurrent: 2 });
    const target = 'https://doujindesu.tv/api';

    const start = Date.now();
    const times = [];

    await Promise.all([
      throttler.throttle(target, async () => {
        times.push(Date.now() - start);
      }),
      throttler.throttle(target, async () => {
        times.push(Date.now() - start);
      }),
    ]);

    assert.equal(times.length, 2);
    // Request kedua harus tertunda setidaknya minIntervalMs
    assert.ok(times[1] >= times[0] + 25);
  });

  test('mendukung setCooldown saat upstream mengembalikan 429', async () => {
    const throttler = new UpstreamThrottler({ minIntervalMs: 10, maxConcurrent: 2 });
    const target = 'https://api.eporner.com';

    throttler.setCooldown(target, 40);

    const start = Date.now();
    await throttler.throttle(target, async () => true);
    const elapsed = Date.now() - start;

    assert.ok(elapsed >= 35);
  });
});

describe('Preset Limiters', () => {
  test('preset limiters terinisialisasi dengan benar', () => {
    assert.ok(generalLimiter instanceof RateLimiter);
    assert.equal(generalLimiter.max, 60);

    assert.ok(searchLimiter instanceof RateLimiter);
    assert.equal(searchLimiter.max, 30);

    assert.ok(imageProxyLimiter instanceof RateLimiter);
    assert.equal(imageProxyLimiter.max, 180);
  });
});

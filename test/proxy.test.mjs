import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeProxyUrl, fetchThroughProxy } from '../src/proxy.js';
import { UnsafeUrlError } from '../src/http.js';

describe('Proxy Hardening (isSafeProxyUrl)', () => {
  test('menolak proxy dengan IP loopback atau 0.0.0.0', () => {
    assert.equal(isSafeProxyUrl('http://127.0.0.1:8080'), false);
    assert.equal(isSafeProxyUrl('http://127.0.0.2:3128'), false);
    assert.equal(isSafeProxyUrl('http://0.0.0.0:8080'), false);
  });

  test('menolak proxy dengan IP private RFC 1918', () => {
    assert.equal(isSafeProxyUrl('http://10.0.0.1:8080'), false);
    assert.equal(isSafeProxyUrl('http://10.255.255.254:3128'), false);
    assert.equal(isSafeProxyUrl('http://172.16.0.1:8080'), false);
    assert.equal(isSafeProxyUrl('http://172.31.255.255:8080'), false);
    assert.equal(isSafeProxyUrl('http://192.168.1.1:8080'), false);
    assert.equal(isSafeProxyUrl('http://192.168.0.100:3128'), false);
  });

  test('menolak proxy dengan IP link-local dan cloud metadata', () => {
    assert.equal(isSafeProxyUrl('http://169.254.169.254:80'), false);
    assert.equal(isSafeProxyUrl('http://100.64.0.1:8080'), false);
  });

  test('menolak proxy dengan IPv6 loopback, private, dan link-local', () => {
    assert.equal(isSafeProxyUrl('http://[::1]:8080'), false);
    assert.equal(isSafeProxyUrl('http://[fc00::1]:8080'), false);
    assert.equal(isSafeProxyUrl('http://[fe80::1]:8080'), false);
  });

  test('menolak proxy dengan hostname localhost atau domain internal', () => {
    assert.equal(isSafeProxyUrl('http://localhost:8080'), false);
    assert.equal(isSafeProxyUrl('http://foo.localhost:3128'), false);
    assert.equal(isSafeProxyUrl('http://server.local:8080'), false);
    assert.equal(isSafeProxyUrl('http://metadata.google.internal:80'), false);
  });

  test('menolak proxy dengan credential di URL', () => {
    assert.equal(isSafeProxyUrl('http://user:pass@198.51.100.1:8080'), false);
    assert.equal(isSafeProxyUrl('http://admin@198.51.100.1:8080'), false);
  });

  test('menolak port tidak valid atau skema non-http(s)', () => {
    assert.equal(isSafeProxyUrl('http://198.51.100.1:0'), false);
    assert.equal(isSafeProxyUrl('http://198.51.100.1:99999'), false);
    assert.equal(isSafeProxyUrl('socks5://198.51.100.1:1080'), false);
    assert.equal(isSafeProxyUrl('ftp://198.51.100.1:21'), false);
  });

  test('menolak input kosong atau bukan string valid', () => {
    assert.equal(isSafeProxyUrl(''), false);
    assert.equal(isSafeProxyUrl(null), false);
    assert.equal(isSafeProxyUrl(undefined), false);
    assert.equal(isSafeProxyUrl('not a proxy'), false);
    assert.equal(isSafeProxyUrl('http://example.com'), false); // tidak ada port
  });

  test('menerima proxy eksternal publik yang sah', () => {
    assert.equal(isSafeProxyUrl('http://91.134.141.4:3128'), true);
    assert.equal(isSafeProxyUrl('http://85.133.250.27:80'), true);
    assert.equal(isSafeProxyUrl('http://198.51.100.1:8080'), true);
    assert.equal(isSafeProxyUrl('https://proxy.example.com:8443'), true);
  });
});

describe('fetchThroughProxy Hardening', () => {
  test('mode direct menolak target SSRF internal lewat safeFetch', async () => {
    const origMode = process.env.EPORNER_PROXY_MODE;
    try {
      process.env.EPORNER_PROXY_MODE = 'direct';
      await assert.rejects(
        () => fetchThroughProxy('http://127.0.0.1/admin'),
        UnsafeUrlError
      );
      await assert.rejects(
        () => fetchThroughProxy('http://169.254.169.254/latest/meta-data'),
        UnsafeUrlError
      );
    } finally {
      process.env.EPORNER_PROXY_MODE = origMode;
    }
  });

  test('mode manual menolak EPORNER_PROXY yang mengarah ke IP internal/loopback', async () => {
    const origMode = process.env.EPORNER_PROXY_MODE;
    const origProxy = process.env.EPORNER_PROXY;
    try {
      process.env.EPORNER_PROXY_MODE = 'manual';
      process.env.EPORNER_PROXY = 'http://127.0.0.1:8080';
      await assert.rejects(
        () => fetchThroughProxy('https://example.com/api'),
        /EPORNER_PROXY tidak aman/
      );

      process.env.EPORNER_PROXY = 'http://localhost:3128';
      await assert.rejects(
        () => fetchThroughProxy('https://example.com/api'),
        /EPORNER_PROXY tidak aman/
      );
    } finally {
      process.env.EPORNER_PROXY_MODE = origMode;
      process.env.EPORNER_PROXY = origProxy;
    }
  });

  test('mode manual menolak jika EPORNER_PROXY kosong', async () => {
    const origMode = process.env.EPORNER_PROXY_MODE;
    const origProxy = process.env.EPORNER_PROXY;
    try {
      process.env.EPORNER_PROXY_MODE = 'manual';
      delete process.env.EPORNER_PROXY;
      await assert.rejects(
        () => fetchThroughProxy('https://example.com/api'),
        /EPORNER_PROXY kosong/
      );
    } finally {
      process.env.EPORNER_PROXY_MODE = origMode;
      process.env.EPORNER_PROXY = origProxy;
    }
  });
});

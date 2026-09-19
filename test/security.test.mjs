import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  isSafeExternalUrl,
  sanitizeUrl,
  safeHttpUrl,
  stripHtml,
  configureDoujin,
  buildSourceUrl,
  scrapeMangaList,
  scrapeMangaDetail,
  scrapeNekoDetail,
  scrapeHentaiDetail,
  scrapeEpornerDetail,
  clearCache,
  getCache,
  setCache,
  cacheSize,
} from 'doujin-scraper';
import {
  assertSlug,
  assertInt,
  assertQuery,
  InvalidInputError,
} from '../src/security.js';
import {
  safeFetch,
  UnsafeUrlError,
  readTextLimited,
  readJsonLimited,
  ResponseTooLargeError,
  MAX_RESPONSE_BYTES_HTML,
  MAX_RESPONSE_BYTES_JSON,
  createSafeDispatcher,
} from '../src/http.js';

describe('isSafeExternalUrl', () => {
  const blocked = [
    'http://localhost',
    'http://localhost.',
    'http://127.0.0.1',
    'http://0.0.0.0',
    'http://10.0.0.1',
    'http://172.16.0.1',
    'http://192.168.1.1',
    'http://169.254.169.254',
    'http://100.64.0.1',
    'http://[::1]',
    'http://[::ffff:127.0.0.1]',
    'http://[fc00::1]',
    'http://[fe80::1]',
    'http://2130706433',
    'http://0x7f.0.0.1',
    'http://user:pass@example.com',
    'http://user@example.com',
    'http://:pass@example.com',
    'file:///etc/passwd',
    'ftp://example.com',
    'https://example.com:8080',
    'not a url',
    '',
  ];

  for (const url of blocked) {
    test(`menolak ${JSON.stringify(url)}`, async () => {
      assert.equal(await isSafeExternalUrl(url), false);
    });
  }

  test('mengizinkan HTTPS biasa (butuh jaringan)', async () => {
    assert.equal(await isSafeExternalUrl('https://example.com'), true);
  });
});

describe('sanitizeUrl', () => {
  const dangerous = [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    '  javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    '\u0000javascript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,test',
    'ftp://example.com/file',
  ];

  for (const url of dangerous) {
    test(`menghapus ${JSON.stringify(url)}`, () => {
      assert.equal(sanitizeUrl(url), '');
    });
  }

  const preserved = [
    'https://example.com',
    'http://example.com/a?b=1#c',
    '/relative/path',
    '//cdn.example.com/a.jpg', // sengaja diizinkan; validasi SSRF dilakukan setelah resolve
  ];

  for (const url of preserved) {
    test(`mempertahankan ${JSON.stringify(url)}`, () => {
      assert.equal(sanitizeUrl(url), url);
    });
  }

  test('input non-string menghasilkan string kosong', () => {
    assert.equal(sanitizeUrl(null), '');
    assert.equal(sanitizeUrl(undefined), '');
    assert.equal(sanitizeUrl(123), '');
  });
});

describe('safeHttpUrl', () => {
  test('menolak javascript:', () => {
    assert.equal(safeHttpUrl('javascript:alert(1)'), '');
  });
  test('menolak ftp:', () => {
    assert.equal(safeHttpUrl('ftp://example.com'), '');
  });
  test('mengizinkan HTTPS (dinormalisasi)', () => {
    assert.equal(safeHttpUrl('https://example.com'), 'https://example.com/');
  });
});

describe('stripHtml', () => {
  test('menghapus script beserta isinya', () => {
    assert.equal(stripHtml('<script>alert(1)</script><p>Hello</p>'), 'Hello');
  });
  test('menghapus style beserta isinya', () => {
    assert.equal(stripHtml('<style>a{}</style><p>Hi</p>'), 'Hi');
  });
  test('menghapus tag biasa', () => {
    assert.equal(stripHtml('<div>Hello <b>world</b></div>'), 'Hello world');
  });
  test('tag bersarang/rusak tidak menyisakan <script', () => {
    assert.doesNotMatch(stripHtml('<scr<script>ipt>alert(1)</scr</script>ipt>'), /<script/i);
  });
  test('input kosong tidak error', () => {
    assert.equal(stripHtml(''), '');
  });
});

describe('Doujindesu credential & baseUrl isolation (T1)', () => {
  const FAKE_SECRET = 'fake-secret-xyz-12345';
  const FAKE_SALT = 'fake-salt-xyz-12345';

  test('menolak baseUrl selain origin terpercaya', () => {
    assert.throws(
      () => configureDoujin({ baseUrl: 'https://evil.example' }),
      /baseUrl/i
    );
  });

  test('menolak baseUrl dengan protokol http:', () => {
    assert.throws(
      () => configureDoujin({ baseUrl: 'http://doujin.desu.xxx' }),
      /baseUrl|https/i
    );
  });

  test('menolak baseUrl dengan user:pass@', () => {
    assert.throws(
      () => configureDoujin({ baseUrl: 'https://user:pass@doujin.desu.xxx' }),
      /baseUrl|kredensial|credential/i
    );
  });

  test('menolak baseUrl dengan port non-standar', () => {
    assert.throws(
      () => configureDoujin({ baseUrl: 'https://doujin.desu.xxx:8080' }),
      /baseUrl|port/i
    );
  });

  test('menerima baseUrl resmi yang sah', () => {
    assert.doesNotThrow(() =>
      configureDoujin({ baseUrl: 'https://doujin.desu.xxx' })
    );
  });

  test('mengirim header rahasia hanya ke origin terpercaya', async () => {
    let capturedHeaders = null;
    let requestedUrl = null;

    const mockFetch = async (url, opts) => {
      requestedUrl = url;
      capturedHeaders = opts?.headers || {};
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    clearCache();
    configureDoujin({
      appSecret: FAKE_SECRET,
      salt: FAKE_SALT,
      baseUrl: 'https://doujin.desu.xxx',
      fetchImpl: mockFetch,
    });

    await scrapeMangaList({ page: 1 });

    assert.ok(requestedUrl.startsWith('https://doujin.desu.xxx/api/'));
    const secretInHeaders =
      capturedHeaders['X-App-Secret'] === FAKE_SECRET ||
      capturedHeaders['x-app-secret'] === FAKE_SECRET;
    assert.equal(secretInHeaders, true);
  });

  test('nilai secret palsu tidak muncul di pesan error ketika request gagal', async () => {
    const mockFailingFetch = async () => {
      return new Response('Not Found', { status: 404 });
    };

    clearCache();
    configureDoujin({
      appSecret: FAKE_SECRET,
      salt: FAKE_SALT,
      baseUrl: 'https://doujin.desu.xxx',
      fetchImpl: mockFailingFetch,
    });

    await assert.rejects(
      async () => scrapeMangaList({ page: 1 }),
      (err) => {
        assert.doesNotMatch(err.message, new RegExp(FAKE_SECRET));
        return true;
      }
    );
  });

  describe('buildSourceUrl (origin guard)', () => {
    const base = 'https://doujin.desu.xxx';

    test('menerima path biasa dan menambahkan prefix /api jika belum ada', () => {
      assert.equal(
        buildSourceUrl(base, '/manga').href,
        'https://doujin.desu.xxx/api/manga'
      );
      assert.equal(
        buildSourceUrl(base, '/api/manga').href,
        'https://doujin.desu.xxx/api/manga'
      );
      assert.equal(
        buildSourceUrl(base, 'manga?page=1').href,
        'https://doujin.desu.xxx/api/manga?page=1'
      );
    });

    test('menolak protocol-relative //evil.com', () => {
      assert.throws(() => buildSourceUrl(base, '//evil.com/x'), /origin/i);
    });

    test('menolak URL absolut https://evil.com', () => {
      assert.throws(() => buildSourceUrl(base, 'https://evil.com/api/x'), /origin/i);
    });

    test('menolak backslash \\\\evil.com', () => {
      assert.throws(() => buildSourceUrl(base, '\\\\evil.com/x'), /origin/i);
    });

    test('menolak path kosong', () => {
      assert.throws(() => buildSourceUrl(base, ''), /kosong/i);
    });
  });

  describe('trustedHosts opt-in kustom', () => {
    test('mengizinkan mirror kustom jika dinyatakan secara eksplisit', () => {
      assert.doesNotThrow(() =>
        configureDoujin({
          baseUrl: 'https://mirror.local',
          trustedHosts: ['mirror.local', 'doujin.desu.xxx'],
        })
      );
    });

    test('tetap menolak host lain yang tidak ada di trustedHosts kustom', () => {
      assert.throws(
        () =>
          configureDoujin({
            baseUrl: 'https://hacker.com',
            trustedHosts: ['mirror.local'],
          }),
        /tidak terpercaya/i
      );
      // kembalikan ke default setelah tes
      configureDoujin({
        baseUrl: 'https://doujin.desu.xxx',
        trustedHosts: ['doujin.desu.xxx'],
      });
    });
  });
});

describe('safeFetch with per-hop redirect validation (T2)', () => {
  test('302 ke http://127.0.0.1/admin ditolak, fetchImpl hanya terpanggil sekali', async () => {
    let callCount = 0;
    const mockFetch = async (url, opts) => {
      callCount++;
      return new Response(null, {
        status: 302,
        headers: { location: 'http://127.0.0.1/admin' },
      });
    };

    await assert.rejects(
      async () => safeFetch('https://example.com/initial', {}, { fetchImpl: mockFetch }),
      UnsafeUrlError
    );
    assert.equal(callCount, 1);
  });

  test('302 ke http://169.254.169.254/ (metadata) ditolak', async () => {
    const mockFetch = async () =>
      new Response(null, {
        status: 302,
        headers: { location: 'http://169.254.169.254/latest/meta-data/' },
      });

    await assert.rejects(
      async () => safeFetch('https://example.com/initial', {}, { fetchImpl: mockFetch }),
      UnsafeUrlError
    );
  });

  test('Location relatif (/next) di-resolve terhadap URL saat ini', async () => {
    const requestedUrls = [];
    const mockFetch = async (url) => {
      requestedUrls.push(url);
      if (requestedUrls.length === 1) {
        return new Response(null, {
          status: 302,
          headers: { location: '/sub/page?q=1' },
        });
      }
      return new Response('OK', { status: 200 });
    };

    const res = await safeFetch(
      'https://example.com/main',
      {},
      { fetchImpl: mockFetch, validate: async () => true }
    );
    assert.equal(res.status, 200);
    assert.equal(requestedUrls[0], 'https://example.com/main');
    assert.equal(requestedUrls[1], 'https://example.com/sub/page?q=1');
  });

  test('Location hilang pada response redirect melempar error yang jelas', async () => {
    const mockFetch = async () => new Response(null, { status: 302 });

    await assert.rejects(
      async () =>
        safeFetch(
          'https://example.com/redir',
          {},
          { fetchImpl: mockFetch, validate: async () => true }
        ),
      /Location/i
    );
  });

  test('Rantai redirect melebihi batas maksimum melempar error', async () => {
    let hops = 0;
    const mockFetch = async () => {
      hops++;
      return new Response(null, {
        status: 302,
        headers: { location: `https://example.com/hop-${hops}` },
      });
    };

    await assert.rejects(
      async () =>
        safeFetch(
          'https://example.com/start',
          {},
          { fetchImpl: mockFetch, validate: async () => true, maxRedirects: 3 }
        ),
      /redirect/i
    );
  });

  test('Downgrade https ke http diblokir', async () => {
    const mockFetch = async () =>
      new Response(null, {
        status: 302,
        headers: { location: 'http://example.com/insecure' },
      });

    await assert.rejects(
      async () =>
        safeFetch(
          'https://example.com/secure',
          {},
          { fetchImpl: mockFetch, validate: async () => true }
        ),
      /downgrade/i
    );
  });

  test('Header sensitif dibuang saat berpindah origin, dipertahankan pada origin sama', async () => {
    const captured = [];
    const mockFetch = async (url, opts) => {
      captured.push({ url, headers: opts.headers });
      if (captured.length === 1) {
        return new Response(null, { status: 302, headers: { location: 'https://example.com/step2' } });
      }
      if (captured.length === 2) {
        return new Response(null, { status: 302, headers: { location: 'https://other.com/step3' } });
      }
      return new Response('DONE', { status: 200 });
    };

    await safeFetch(
      'https://example.com/step1',
      {
        headers: {
          'X-App-Secret': 'secret123',
          Authorization: 'Bearer xyz',
          'User-Agent': 'TestAgent',
        },
      },
      { fetchImpl: mockFetch, validate: async () => true }
    );

    assert.equal(captured.length, 3);
    const h1 = captured[0].headers instanceof Headers ? captured[0].headers : new Headers(captured[0].headers);
    assert.equal(h1.get('x-app-secret'), 'secret123');
    assert.equal(h1.get('authorization'), 'Bearer xyz');

    const h2 = captured[1].headers instanceof Headers ? captured[1].headers : new Headers(captured[1].headers);
    assert.equal(h2.get('x-app-secret'), 'secret123');
    assert.equal(h2.get('authorization'), 'Bearer xyz');

    const h3 = captured[2].headers instanceof Headers ? captured[2].headers : new Headers(captured[2].headers);
    assert.equal(h3.get('x-app-secret'), null);
    assert.equal(h3.get('authorization'), null);
    assert.equal(h3.get('user-agent'), 'TestAgent');
  });

  test('redirect: manual selalu diteruskan ke fetchImpl', async () => {
    let receivedRedirectOption = null;
    const mockFetch = async (url, opts) => {
      receivedRedirectOption = opts.redirect;
      return new Response('OK', { status: 200 });
    };

    await safeFetch(
      'https://example.com/direct',
      { redirect: 'follow' },
      { fetchImpl: mockFetch, validate: async () => true }
    );
    assert.equal(receivedRedirectOption, 'manual');
  });

  test('303 dari POST dialihkan menjadi GET tanpa body', async () => {
    const received = [];
    const mockFetch = async (url, opts) => {
      received.push({ method: opts.method, body: opts.body });
      if (received.length === 1) {
        return new Response(null, { status: 303, headers: { location: '/result' } });
      }
      return new Response('OK', { status: 200 });
    };

    await safeFetch(
      'https://example.com/post',
      { method: 'POST', body: 'some data' },
      { fetchImpl: mockFetch, validate: async () => true }
    );

    assert.equal(received[0].method, 'POST');
    assert.equal(received[0].body, 'some data');
    assert.equal(received[1].method, 'GET');
    assert.equal(received[1].body, undefined);
  });

  test('Response non-redirect dikembalikan apa adanya', async () => {
    const mockFetch = async () =>
      new Response('Hello World', { status: 200, headers: { 'x-test': 'ok' } });
    const res = await safeFetch(
      'https://example.com/page',
      {},
      { fetchImpl: mockFetch, validate: async () => true }
    );
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'Hello World');
    assert.equal(res.headers.get('x-test'), 'ok');
  });
});

describe('readTextLimited & readJsonLimited (T3)', () => {
  test('Content-Length > batas melempar ResponseTooLargeError tanpa membaca stream', async () => {
    let streamRead = false;
    const bodyStream = new ReadableStream({
      pull(controller) {
        streamRead = true;
        controller.enqueue(new Uint8Array([65, 66, 67]));
        controller.close();
      },
    });

    const res = new Response(bodyStream, {
      headers: { 'content-length': '1000' },
    });

    await assert.rejects(
      async () => readTextLimited(res, 500),
      ResponseTooLargeError
    );
    assert.equal(streamRead, false);
  });

  test('Tanpa Content-Length, stream melewati batas melempar ResponseTooLargeError dan memanggil cancel', async () => {
    let cancelled = false;
    const bodyStream = new ReadableStream({
      pull(controller) {
        controller.enqueue(new Uint8Array(600));
      },
      cancel() {
        cancelled = true;
      },
    });

    const res = new Response(bodyStream);

    await assert.rejects(
      async () => readTextLimited(res, 500),
      ResponseTooLargeError
    );
    assert.equal(cancelled, true);
  });

  test('Body tepat sebesar batas byte lolos tanpa error', async () => {
    const data = new Uint8Array([104, 101, 108, 108, 111]); // 5 bytes ('hello')
    const res = new Response(data, {
      headers: { 'content-length': '5' },
    });

    const text = await readTextLimited(res, 5);
    assert.equal(text, 'hello');
  });

  test('Karakter UTF-8 multi-byte yang terpotong antar dua chunk terdekode dengan benar', async () => {
    // Emoji '😀' (U+1F600) di-encode ke 4 byte: [0xF0, 0x9F, 0x98, 0x80]
    const chunk1 = new Uint8Array([0xF0, 0x9F]);
    const chunk2 = new Uint8Array([0x98, 0x80]);

    const bodyStream = new ReadableStream({
      start(controller) {
        controller.enqueue(chunk1);
        controller.enqueue(chunk2);
        controller.close();
      },
    });

    const res = new Response(bodyStream);
    const text = await readTextLimited(res, 100);
    assert.equal(text, '😀');
  });

  test('readJsonLimited mem-parse JSON yang valid', async () => {
    const res = new Response(JSON.stringify({ title: 'Test Manga', count: 42 }));
    const json = await readJsonLimited(res, 1024);
    assert.equal(json.title, 'Test Manga');
    assert.equal(json.count, 42);
  });

  test('readJsonLimited melempar error yang jelas jika format JSON rusak', async () => {
    const res = new Response('{"title": "Unfinished JSON...');
    await assert.rejects(
      async () => readJsonLimited(res, 1024),
      /Gagal mem-parse JSON/i
    );
  });
});

describe('Input bounds & validation (T4)', () => {
  describe('assertSlug', () => {
    test('menolak input non-string atau kosong', () => {
      assert.throws(() => assertSlug(null), InvalidInputError);
      assert.throws(() => assertSlug(undefined), InvalidInputError);
      assert.throws(() => assertSlug(123), InvalidInputError);
      assert.throws(() => assertSlug(''), InvalidInputError);
      assert.throws(() => assertSlug('   '), InvalidInputError);
    });

    test('menolak slug yang melebihi batas panjang maksimum', () => {
      const longSlug = 'a'.repeat(201);
      assert.throws(() => assertSlug(longSlug), InvalidInputError);
    });

    test('menolak slug dengan path traversal dan karakter terlarang (.., /, \\, ?, #, %2f)', () => {
      assert.throws(() => assertSlug('../etc/passwd'), InvalidInputError);
      assert.throws(() => assertSlug('manga/detail'), InvalidInputError);
      assert.throws(() => assertSlug('manga\\detail'), InvalidInputError);
      assert.throws(() => assertSlug('slug?x=1'), InvalidInputError);
      assert.throws(() => assertSlug('slug#section'), InvalidInputError);
      assert.throws(() => assertSlug('slug%2fother'), InvalidInputError);
      assert.throws(() => assertSlug('//evil.com'), InvalidInputError);
      assert.throws(() => assertSlug('slug\u0000bad'), InvalidInputError);
    });

    test('menerima slug nyata dari berbagai sumber (Doujindesu, NekoPoi, Hentai.tv, Eporner, unicode)', () => {
      const validSlugs = [
        'shin-mai-fukei-chara-h-na-reikan-taishitsu-chapter-1-bahasa-indonesia',
        'isekai-cheat-magic-swordsman',
        'secret-class',
        'ano-hi-no-hanashi-vol-1',
        'isekai-harem-monogatari-episode-1-subtitle-indonesia',
        'shoujo-ramune-episode-1',
        'overflow-episode-1',
        'kyonyuu-fantasy',
        'yU5wN5vYI5O',
        '5558112',
        'asian',
        'comic-(2023)',
        'manga-[raw]',
        'ch.1.5',
        '東京喰種-re',
      ];
      for (const slug of validSlugs) {
        assert.equal(assertSlug(slug), slug);
      }
    });
  });

  describe('assertInt', () => {
    test('menolak nilai non-integer, di luar rentang, atau NaN', () => {
      assert.throws(() => assertInt(0, { min: 1, max: 1000 }), InvalidInputError);
      assert.throws(() => assertInt(-1, { min: 1, max: 1000 }), InvalidInputError);
      assert.throws(() => assertInt(1.5, { min: 1, max: 1000 }), InvalidInputError);
      assert.throws(() => assertInt('abc', { min: 1, max: 1000 }), InvalidInputError);
      assert.throws(() => assertInt(1e9, { min: 1, max: 1000 }), InvalidInputError);
      assert.throws(() => assertInt(NaN, { min: 1, max: 1000 }), InvalidInputError);
      assert.throws(() => assertInt(Infinity, { min: 1, max: 1000 }), InvalidInputError);
      assert.throws(() => assertInt(null, { min: 1, max: 1000 }), InvalidInputError);
      assert.throws(() => assertInt(101, { min: 1, max: 100 }), InvalidInputError);
    });

    test('menerima integer valid dan menormalkan string digit', () => {
      assert.equal(assertInt(1, { min: 1, max: 1000 }), 1);
      assert.equal(assertInt('42', { min: 1, max: 1000 }), 42);
      assert.equal(assertInt(undefined, { min: 1, max: 1000, defaultValue: 1 }), 1);
    });
  });

  describe('assertQuery', () => {
    test('menolak query non-string, kosong, atau terlalu panjang', () => {
      assert.throws(() => assertQuery(null), InvalidInputError);
      assert.throws(() => assertQuery(123), InvalidInputError);
      assert.throws(() => assertQuery(''), InvalidInputError);
      assert.throws(() => assertQuery('   '), InvalidInputError);
      assert.throws(() => assertQuery('a'.repeat(101)), InvalidInputError);
    });

    test('membuang control characters dan mengembalikan query yang valid', () => {
      assert.equal(assertQuery('naruto'), 'naruto');
      assert.equal(assertQuery('  one piece  '), 'one piece');
      assert.equal(assertQuery('attack\u0000on\u0007titan'), 'attackontitan');
    });
  });

  describe('Scraper integration input bounds', () => {
    test('scrapeMangaList menolak parameter page / limit di luar batas', async () => {
      await assert.rejects(async () => scrapeMangaList({ page: 0 }), InvalidInputError);
      await assert.rejects(async () => scrapeMangaList({ page: -5 }), InvalidInputError);
      await assert.rejects(async () => scrapeMangaList({ limit: 101 }), InvalidInputError);
    });

    test('scrapeMangaDetail menolak path traversal', async () => {
      await assert.rejects(async () => scrapeMangaDetail('../admin'), InvalidInputError);
      await assert.rejects(async () => scrapeMangaDetail('//evil.com'), InvalidInputError);
    });

    test('scrapeNekoDetail menolak slug dengan karakter path separator', async () => {
      await assert.rejects(async () => scrapeNekoDetail('bad/slug'), InvalidInputError);
      await assert.rejects(async () => scrapeNekoDetail('bad%2fslug'), InvalidInputError);
    });

    test('scrapeHentaiDetail menolak slug invalid', async () => {
      await assert.rejects(async () => scrapeHentaiDetail('slug?x=1'), InvalidInputError);
      await assert.rejects(async () => scrapeHentaiDetail('slug#section'), InvalidInputError);
    });

    test('scrapeEpornerDetail menolak id dengan path traversal atau slash', async () => {
      await assert.rejects(async () => scrapeEpornerDetail('../secret'), InvalidInputError);
      await assert.rejects(async () => scrapeEpornerDetail('id/slash'), InvalidInputError);
    });
  });
});

describe('Cache bounds & LRU eviction (T5)', () => {
  test('clearCache mengosongkan seluruh entry', () => {
    setCache('k1', 'val1');
    setCache('k2', 'val2');
    assert.ok(cacheSize() >= 2);
    clearCache();
    assert.equal(cacheSize(), 0);
    assert.equal(getCache('k1'), null);
  });

  test('setCache membatasi jumlah entry maksimum (LRU cap)', () => {
    clearCache();
    for (let i = 0; i < 550; i++) {
      setCache(`item-${i}`, i);
    }
    assert.equal(cacheSize(), 500);
    // Entry 0-49 seharusnya sudah dibuang karena melewati batas 500
    assert.equal(getCache('item-0'), null);
    assert.equal(getCache('item-49'), null);
    assert.equal(getCache('item-50'), 50);
    assert.equal(getCache('item-549'), 549);
    clearCache();
  });

  test('LRU eviction: entry yang di-get dipindahkan ke posisi paling baru', () => {
    clearCache();
    for (let i = 0; i < 500; i++) {
      setCache(`item-${i}`, i);
    }
    // Akses item-0 sehingga menjadi paling baru
    assert.equal(getCache('item-0'), 0);

    // Tambahkan 1 item baru yang akan memicu eviction
    setCache('item-new', 999);

    // item-0 harus tetap ada karena baru saja diakses
    assert.equal(getCache('item-0'), 0);
    // item-1 (yang sekarang paling lama tidak diakses) harus terbuang
    assert.equal(getCache('item-1'), null);
    assert.equal(getCache('item-new'), 999);
    clearCache();
  });

  test('menolak atau tidak menyimpan key dengan panjang > 512 karakter', () => {
    clearCache();
    const longKey = 'k'.repeat(513);
    setCache(longKey, 'too-long');
    assert.equal(getCache(longKey), null);
    assert.equal(cacheSize(), 0);
  });

  test('menolak menyimpan error atau value bernilai null/undefined', () => {
    clearCache();
    setCache('err-key', new Error('fail'));
    assert.equal(getCache('err-key'), null);
    setCache('null-key', null);
    assert.equal(getCache('null-key'), null);
    setCache('undef-key', undefined);
    assert.equal(getCache('undef-key'), null);
    assert.equal(cacheSize(), 0);
  });
});

describe('Security Guard Tests (T6)', () => {
  test('tidak ada panggilan fetch mentah tanpa komentar safe-fetch-exempt di luar src/http.js', () => {
    const srcDir = path.resolve('src');
    const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.js'));
    const violations = [];

    for (const file of files) {
      if (file === 'http.js') continue; // safeFetch diimplementasikan di sini
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Deteksi pemanggilan fungsi fetch(...)
        if (/\bfetch\(/.test(line)) {
          const prevLine = i > 0 ? lines[i - 1] : '';
          const hasExempt =
            line.includes('safe-fetch-exempt') || prevLine.includes('safe-fetch-exempt');
          if (!hasExempt) {
            violations.push(`${file}:${i + 1}: ${line.trim()}`);
          }
        }
      }
    }

    assert.deepEqual(
      violations,
      [],
      `Ditemukan panggilan raw fetch tanpa safe-fetch-exempt:\n${violations.join('\n')}`
    );
  });
});

describe('DNS Rebinding / TOCTOU protection (T7)', () => {
  test('isSafeExternalUrl menerima dnsLookup kustom untuk pengujian deterministik', async () => {
    const mockLookupSafe = async () => [{ address: '93.184.216.34', family: 4 }];
    const mockLookupPrivate = async () => [{ address: '127.0.0.1', family: 4 }];

    assert.equal(
      await isSafeExternalUrl('https://example.com', { dnsLookup: mockLookupSafe }),
      true
    );
    assert.equal(
      await isSafeExternalUrl('https://example.com', { dnsLookup: mockLookupPrivate }),
      false
    );
  });

  test('safeFetch menolak koneksi jika DNS mengembalikan IP internal/loopback saat koneksi dibuat', async () => {
    // Simulasi DNS Rebinding: pre-validation lolos dengan IP publik, tapi saat koneksi socket dibuka,
    // DNS berubah mengembalikan IP private/loopback (127.0.0.1).
    const mockLookupRebinding = async () => [{ address: '127.0.0.1', family: 4 }];
    const safeDispatcher = createSafeDispatcher(mockLookupRebinding);

    await assert.rejects(
      async () =>
        safeFetch(
          'https://example.com/test',
          {},
          {
            validate: async () => true, // pre-check lolos (bypass TOCTOU)
            dispatcher: safeDispatcher,
          }
        ),
      /DNS Rebinding|tidak aman|tidak diizinkan/i
    );
  });
});
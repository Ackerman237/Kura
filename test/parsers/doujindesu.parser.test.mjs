import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateKey,
  decryptHex,
  candidateKeys,
  decryptResponse,
} from '../../src/sources/doujindesu/crypto.js';
import {
  mapListItem,
  cleanSynopsis,
  mapDetail,
  mapGenres,
  mapChapterImages,
} from '../../src/sources/doujindesu/parser.js';
import {
  validateBaseUrl,
  buildSourceUrl,
  buildAuthHeaders,
} from '../../src/sources/doujindesu/client.js';

test('Doujindesu Crypto (Pure Unit)', async (t) => {
  await t.test('generateKey produces 32 printable ASCII chars deterministically', () => {
    const key1 = generateKey('test-salt_12345');
    const key2 = generateKey('test-salt_12345');
    assert.equal(key1, key2);
    assert.equal(key1.length, 32);
    assert.match(key1, /^[\x21-\x7e]{32}$/);
  });

  await t.test('candidateKeys returns 3 keys for current, past, and future hour buckets', () => {
    const fixedTime = 1700000000000;
    const keys = candidateKeys('my-salt', () => fixedTime);
    assert.equal(keys.length, 3);
    for (const k of keys) {
      assert.equal(k.length, 32);
    }
  });

  await t.test('decryptResponse throws clear error when ciphertext cannot be decrypted', () => {
    assert.throws(
      () => decryptResponse('deadbeef1234', 'wrong-salt'),
      /Failed to decrypt server response/
    );
  });
});

test('Doujindesu Parser (Pure Unit)', async (t) => {
  await t.test('cleanSynopsis decodes double-encoded HTML entities and strips tags', () => {
    const raw = '&amp;lt;b&amp;gt;Sinopsis:&amp;lt;/b&amp;gt; Cerita &lt;i&gt;petualangan&lt;/i&gt; &amp;amp; cinta.<br>Baris baru.';
    const cleaned = cleanSynopsis(raw);
    assert.equal(cleaned, 'Sinopsis: Cerita petualangan & cinta.\nBaris baru.');
  });

  await t.test('cleanSynopsis handles null or empty input gracefully', () => {
    assert.equal(cleanSynopsis(''), '');
    assert.equal(cleanSynopsis(null), '');
  });

  await t.test('mapListItem normalizes item with latest chapter and resolved relative thumb', () => {
    const item = {
      title: 'Manga Test',
      slug: 'manga-test',
      cover_url: '/uploads/covers/test.jpg',
      rating: 8.5,
      type: 'doujinshi',
      status: 'Ongoing',
      chapters: [{ id: 1, chapter_number: 12 }],
    };
    const mapped = mapListItem(item, 'https://doujin.desu.xxx');
    assert.deepEqual(mapped, {
      title: 'Manga Test',
      slug: 'manga-test',
      thumb: 'https://doujin.desu.xxx/uploads/covers/test.jpg',
      rating: 8.5,
      type: 'doujinshi',
      status: 'Ongoing',
      latestChapter: 12,
    });
  });

  await t.test('mapListItem returns null for invalid items', () => {
    assert.equal(mapListItem(null), null);
    assert.equal(mapListItem('not an object'), null);
  });

  await t.test('mapDetail normalizes full manga detail, genres, chapters, and author', () => {
    const detail = {
      title: 'Manga Detail Test',
      alt_titles: 'Alternative Title',
      cover_url: 'https://cdn.example.com/cover.jpg',
      rating: 9.1,
      status: 'Completed',
      type: 'manga',
      description: '<p>Cerita lengkap &amp; seru</p>',
      author: { name: 'Author Sensei' },
      artist: 'Artist Sama',
      views: 15400,
      manga_genres: [
        { genres: { name: 'Romance', slug: 'romance' } },
        { genres: { name: 'Comedy', slug: 'comedy' } },
      ],
      chapters: [
        { id: 101, chapter_number: 1, title: 'Chapter 1', created_at: '2026-01-01T00:00:00.000Z' },
      ],
    };
    const mapped = mapDetail(detail, 'https://doujin.desu.xxx');
    assert.equal(mapped.title, 'Manga Detail Test');
    assert.equal(mapped.altTitle, 'Alternative Title');
    assert.equal(mapped.thumb, 'https://cdn.example.com/cover.jpg');
    assert.equal(mapped.author, 'Author Sensei');
    assert.equal(mapped.artist, 'Artist Sama');
    assert.equal(mapped.views, 15400);
    assert.equal(mapped.genres.length, 2);
    assert.equal(mapped.genres[0].slug, 'romance');
    assert.equal(mapped.chapters.length, 1);
    assert.equal(mapped.chapters[0].id, 101);
  });

  await t.test('mapGenres sorts genres by count descending', () => {
    const raw = [
      { slug: 'action', name: 'Action', manga_count: 50 },
      { slug: 'romance', name: 'Romance', manga_count: 120 },
      { slug: 'comedy', name: 'Comedy', manga_count: 85 },
    ];
    const mapped = mapGenres(raw);
    assert.equal(mapped[0].slug, 'romance');
    assert.equal(mapped[1].slug, 'comedy');
    assert.equal(mapped[2].slug, 'action');
  });

  await t.test('mapChapterImages filters unsafe image URLs and extracts metadata', () => {
    const chapter = {
      manga_slug: 'test-manga',
      manga_title: 'Test Manga',
      chapter_number: 5,
      content_urls: [
        'https://cdn.example.com/img1.jpg',
        'javascript:alert(1)',
        'https://cdn.example.com/img2.jpg',
      ],
    };
    const mapped = mapChapterImages(chapter);
    assert.deepEqual(mapped.images, [
      'https://cdn.example.com/img1.jpg',
      'https://cdn.example.com/img2.jpg',
    ]);
    assert.equal(mapped.mangaSlug, 'test-manga');
    assert.equal(mapped.number, 5);
  });

  await t.test('mapChapterImages throws when no valid images exist', () => {
    assert.throws(
      () => mapChapterImages({ content_urls: ['javascript:alert(1)'] }),
      /This chapter has no images yet/
    );
  });
});

test('Doujindesu Client (Pure Transport Guard)', async (t) => {
  await t.test('validateBaseUrl enforces HTTPS, standard port, and trusted host', () => {
    const trusted = new Set(['doujin.desu.xxx']);
    assert.equal(validateBaseUrl('https://doujin.desu.xxx', trusted), 'https://doujin.desu.xxx');
    assert.throws(() => validateBaseUrl('http://doujin.desu.xxx', trusted), /protokol https:/);
    assert.throws(() => validateBaseUrl('https://evil.com', trusted), /tidak terpercaya/);
    assert.throws(() => validateBaseUrl('https://doujin.desu.xxx:8443', trusted), /port non-standar/);
  });

  await t.test('buildSourceUrl safely handles paths and prevents origin hijack', () => {
    const url = buildSourceUrl('https://doujin.desu.xxx', '/manga?limit=24');
    assert.equal(url.href, 'https://doujin.desu.xxx/api/manga?limit=24');

    assert.throws(() => buildSourceUrl('https://doujin.desu.xxx', '//evil.com'), /origin/);
    assert.throws(() => buildSourceUrl('https://doujin.desu.xxx', 'https://evil.com'), /origin/);
  });

  await t.test('buildAuthHeaders only includes secret for trusted target origin', () => {
    const trusted = new Set(['doujin.desu.xxx']);
    const trustedHeaders = buildAuthHeaders({
      targetUrl: 'https://doujin.desu.xxx/api/manga',
      baseUrl: 'https://doujin.desu.xxx',
      trustedHosts: trusted,
      appSecret: 'super-secret',
    });
    assert.equal(trustedHeaders['X-App-Secret'], 'super-secret');
    assert.ok(trustedHeaders['x-device-id']);

    const untrustedHeaders = buildAuthHeaders({
      targetUrl: 'https://evil.com/api/manga',
      baseUrl: 'https://doujin.desu.xxx',
      trustedHosts: trusted,
      appSecret: 'super-secret',
    });
    assert.equal(untrustedHeaders['X-App-Secret'], undefined);
  });
});

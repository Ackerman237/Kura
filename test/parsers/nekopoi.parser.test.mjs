import test from 'node:test';
import assert from 'node:assert/strict';

import {
  decodeEntities,
  parseCards,
  parseDetail,
  parseCategories,
  parseGenres,
  ALLOWED_PLAYER_HOSTS,
} from '../../src/sources/nekopoi/parser.js';

test('NekoPoi Parser (Pure Unit)', async (t) => {
  await t.test('decodeEntities decodes quotes, dashes, and HTML entities', () => {
    const raw = 'Title &#8211; Episode 1 &#8220;Special&#8221; &amp; More &nbsp;';
    assert.equal(decodeEntities(raw), 'Title – Episode 1 "Special" & More');
  });

  await t.test('parseCards extracts Format 1 nk-post-card (Home)', () => {
    const html = `
      <div class="nk-post-card">
        <div style="background-image:url('https://img.nekopoi.care/thumb1.jpg')"></div>
        <a href="https://nekopoi.care/hentai-episode-1/">
          <h2>Hentai Episode 1 &#8211; Sub Indo</h2>
        </a>
        <span>Senin, 12 Januari 2026</span>
      </div>
    `;
    const cards = parseCards(html, 'https://nekopoi.care');
    assert.equal(cards.length, 1);
    assert.equal(cards[0].title, 'Hentai Episode 1 – Sub Indo');
    assert.equal(cards[0].slug, 'hentai-episode-1');
    assert.equal(cards[0].thumb, 'https://img.nekopoi.care/thumb1.jpg');
    assert.match(cards[0].date, /Senin/);
  });

  await t.test('parseCards extracts Format 2 nk-search-item (Category/Search)', () => {
    const html = `
      <a href="https://nekopoi.care/category-hentai-video/" class="nk-search-item">
        <div class="nk-search-thumb" style="background-image:url('//img.nekopoi.care/thumb2.jpg')"></div>
        <h2>Search Video Title</h2>
        <p class="nk-search-desc">Deskripsi singkat &amp; seru.</p>
      </a>
    `;
    const cards = parseCards(html, 'https://nekopoi.care');
    assert.equal(cards.length, 1);
    assert.equal(cards[0].title, 'Search Video Title');
    assert.equal(cards[0].slug, 'category-hentai-video');
    assert.equal(cards[0].thumb, 'https://img.nekopoi.care/thumb2.jpg');
    assert.equal(cards[0].synopsis, 'Deskripsi singkat & seru.');
  });

  await t.test('parseCards ignores external / non-nekopoi URLs', () => {
    const html = `
      <div class="nk-post-card">
        <a href="https://evil-phishing.com/scam/">
          <h2>Phishing Link</h2>
        </a>
      </div>
    `;
    const cards = parseCards(html, 'https://nekopoi.care');
    assert.equal(cards.length, 0);
  });

  await t.test('parseDetail parses post detail, extracts allowed players, and filters tracker iframes', () => {
    const html = `
      <title>Isekai Hentai Episode 2 &#8211; NekoPoi</title>
      <meta property="og:image" content="https://img.nekopoi.care/cover.jpg" />
      <div class="content">
        <iframe src="https://streampoi.com/embed/xyz123" width="100%" height="400"></iframe>
        <iframe src="https://playmogo.com/embed/abc" width="100%" height="400"></iframe>
        <iframe src="https://googleads.doubleclick.net/pagead/ads" width="300" height="250"></iframe>
        <iframe src="javascript:alert(1)"></iframe>
        <p>Sinopsis lengkap video ini menceritakan petualangan di dunia fantasi yang sangat seru dan menantang bagi para penonton.</p>
      </div>
    `;
    const detail = parseDetail(html, 'isekai-hentai-episode-2');
    assert.equal(detail.title, 'Isekai Hentai Episode 2');
    assert.equal(detail.slug, 'isekai-hentai-episode-2');
    assert.equal(detail.thumb, 'https://img.nekopoi.care/cover.jpg');
    assert.deepEqual(detail.players, [
      'https://streampoi.com/embed/xyz123',
      'https://playmogo.com/embed/abc',
    ]);
    assert.match(detail.synopsis, /Sinopsis lengkap video ini/);
  });

  await t.test('parseCategories parses distinct categories from list page', () => {
    const html = `
      <a href="https://nekopoi.care/category/jav-uncensored/">JAV Uncensored</a>
      <a href="https://nekopoi.care/category/2d-animation/">2D Animation</a>
      <a href="https://nekopoi.care/category/jav-uncensored/">Duplicate</a>
    `;
    const cats = parseCategories(html);
    assert.equal(cats.length, 2);
    assert.equal(cats[0].slug, 'jav-uncensored');
    assert.equal(cats[0].name, 'jav uncensored');
    assert.equal(cats[1].slug, '2d-animation');
  });

  await t.test('parseGenres parses distinct genres and decodes names', () => {
    const html = `
      <a href="https://nekopoi.care/genres/vanilla/">Vanilla</a>
      <a href="https://nekopoi.care/genres/school-girl/">School &amp; Girl</a>
    `;
    const genres = parseGenres(html);
    assert.equal(genres.length, 2);
    assert.equal(genres[0].slug, 'vanilla');
    assert.equal(genres[1].name, 'School & Girl');
  });
});

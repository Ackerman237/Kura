import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fmtDuration,
  fmtViews,
  mapVideo,
  parseHentaiDetailHtml,
  unescapeRscChunk,
  joinRscPayload,
  extractBalancedObject,
  stripGlobalWidgets,
  parseRscVideos,
  parseGenres,
  parseSeries,
} from '../../src/sources/hentaitv/parser.js';

test('Hentai.tv Parser (Pure Unit)', async (t) => {
  await t.test('fmtDuration converts ISO-8601 strings to minutes:seconds and hours:minutes:seconds', () => {
    assert.equal(fmtDuration('PT24M48S'), '24:48');
    assert.equal(fmtDuration('PT1H15M30S'), '1:15:30');
    assert.equal(fmtDuration(''), '');
  });

  await t.test('fmtViews formats numbers to compact suffixes', () => {
    assert.equal(fmtViews(1500000), '1.5M');
    assert.equal(fmtViews(24500), '24.5K');
    assert.equal(fmtViews(750), '750');
    assert.equal(fmtViews(0), '');
  });

  await t.test('mapVideo normalizes raw video item and resolves relative URLs', () => {
    const raw = {
      id: 'vid-123',
      slug: 'sample-hentai-episode-1',
      title: '<b>Sample Hentai</b>',
      ep: 1,
      titleSlug: 'sample-hentai',
      views: 12000,
      cover: '/covers/sample.jpg',
      embedUrl: 'https://player.example.com/embed/123',
      description: '<p>Cerita hentai menarik.</p>',
    };
    const mapped = mapVideo(raw, 'https://hentai.tv');
    assert.equal(mapped.title, 'Sample Hentai');
    assert.equal(mapped.displayTitle, 'Sample Hentai EP 1');
    assert.equal(mapped.thumb, 'https://hentai.tv/covers/sample.jpg');
    assert.equal(mapped.embedUrl, 'https://player.example.com/embed/123');
    assert.equal(mapped.description, 'Cerita hentai menarik.');
  });

  await t.test('parseHentaiDetailHtml parses JSON-LD and tag chips', () => {
    const html = `
      <title>Watch Sample Anime Episode 1 Online at Hentai.tv</title>
      <meta property="og:image" content="https://img.hentai.tv/cover.jpg" />
      <script type="application/ld+json">
        {
          "@type": "VideoObject",
          "name": "Sample Anime - Watch Online",
          "description": "Awesome video description",
          "embedUrl": "https://video.hentai.tv/embed/sample-1",
          "duration": "PT22M15S",
          "uploadDate": "2026-02-01",
          "interactionStatistic": {
            "@type": "InteractionCounter",
            "userInteractionCount": 42000
          }
        }
      </script>
      <a class="tag-chip" href="/genre/vanilla/">Vanilla</a>
      <a class="tag-chip" href="/genre/romance/">Romance</a>
    `;
    const detail = parseHentaiDetailHtml(html, 'sample-anime-episode-1');
    assert.equal(detail.title, 'Sample Anime Episode 1');
    assert.equal(detail.displayTitle, 'Sample Anime Episode 1');
    assert.equal(detail.ep, 1);
    assert.equal(detail.thumb, 'https://img.hentai.tv/cover.jpg');
    assert.equal(detail.embedUrl, 'https://video.hentai.tv/embed/sample-1');
    assert.equal(detail.duration, '22:15');
    assert.equal(detail.views, 42000);
    assert.deepEqual(detail.tags, ['Vanilla', 'Romance']);
  });

  await t.test('RSC payload extraction and balanced object parsing', () => {
    const chunk1 = '1:{"id":"vid-1","slug":"test-slug-1","title":"Test Video 1","embedUrl":"https://player.com/1"}';
    const escaped = JSON.stringify(chunk1).slice(1, -1);
    const html = `<script>self.__next_f.push([1,"${escaped}"])</script>`;

    const joined = joinRscPayload(html);
    assert.ok(joined.includes('test-slug-1'));

    const videos = parseRscVideos(html);
    assert.equal(videos.length, 1);
    assert.equal(videos[0].slug, 'test-slug-1');
    assert.equal(videos[0].title, 'Test Video 1');
  });

  await t.test('stripGlobalWidgets removes notifications and history lists from RSC', () => {
    const input = 'prefix "initialSaved":[{"id":"bad"}] suffix';
    const stripped = stripGlobalWidgets(input);
    assert.ok(!stripped.includes('initialSaved'));
    assert.ok(stripped.includes('prefix'));
    assert.ok(stripped.includes('suffix'));
  });

  await t.test('parseGenres and parseSeries extract unique slugs and names', () => {
    const genreHtml = `
      <a href="/genre/cosplay/">Cosplay</a>
      <a href="/genre/yuri/">Yuri</a>
      <a href="/genre/cosplay/">Duplicate</a>
    `;
    const genres = parseGenres(genreHtml);
    assert.equal(genres.length, 2);
    assert.equal(genres[0].slug, 'cosplay');
    assert.equal(genres[1].slug, 'yuri');

    const seriesHtml = `
      <a href="/series/overflow/">Overflow</a>
      <a href="/series/resort-boin/">Resort Boin</a>
    `;
    const series = parseSeries(seriesHtml);
    assert.equal(series.length, 2);
    assert.equal(series[0].slug, 'overflow');
    assert.equal(series[1].name, 'resort boin');
  });
});

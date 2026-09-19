import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fmtViews,
  mapVideo,
  parseEpornerSources,
  parseCategories,
  parseEpornerListing,
} from '../../src/sources/eporner/parser.js';

test('Eporner Parser (Pure Unit)', async (t) => {
  await t.test('fmtViews formats numbers correctly', () => {
    assert.equal(fmtViews(1200000), '1.2M');
    assert.equal(fmtViews(45000), '45.0K');
    assert.equal(fmtViews(100), '100');
    assert.equal(fmtViews(0), '');
  });

  await t.test('mapVideo normalizes raw API video item and extracts tags', () => {
    const raw = {
      id: 'abc12345',
      title: 'Sample Eporner Video',
      default_thumb: { src: 'https://static.eporner.com/thumbs/abc.jpg' },
      length_min: '15:20',
      length_sec: 920,
      views: 55000,
      rate: '4.8',
      added: '2026-03-01',
      keywords: 'hd, asian, cosplay',
      url: 'https://www.eporner.com/video-abc12345/',
    };
    const mapped = mapVideo(raw);
    assert.equal(mapped.id, 'abc12345');
    assert.equal(mapped.slug, 'abc12345');
    assert.equal(mapped.title, 'Sample Eporner Video');
    assert.equal(mapped.thumb, 'https://static.eporner.com/thumbs/abc.jpg');
    assert.equal(mapped.duration, '15:20');
    assert.equal(mapped.durationSec, 920);
    assert.deepEqual(mapped.tags, ['hd', 'asian', 'cosplay']);
    assert.equal(mapped.source, 'eporner');
  });

  await t.test('parseEpornerSources extracts mp4 download links sorted by quality DESC', () => {
    const html = `
      <div id="downloaddiv">
        <a href="/dload/abc12345/480/abc-480p.mp4">Download 480p</a>
        <a href="/dload/abc12345/1080/abc-1080p.mp4">Download 1080p</a>
        <a href="/dload/abc12345/720/abc-720p.mp4">Download 720p</a>
      </div>
    `;
    const sources = parseEpornerSources(html, 'https://www.eporner.com');
    assert.equal(sources.length, 3);
    assert.equal(sources[0].label, '1080p');
    assert.equal(sources[0].url, 'https://www.eporner.com/dload/abc12345/1080/abc-1080p.mp4');
    assert.equal(sources[1].label, '720p');
    assert.equal(sources[2].label, '480p');
  });

  await t.test('parseCategories extracts category links and ignores all', () => {
    const html = `
      <a href="/cat/all/" title="All Videos">All</a>
      <a href="/cat/japanese/" title="Japanese Adult">Japanese</a>
      <a href="/cat/virtual-reality/" title="VR Porn">VR</a>
      <a href="/cat/japanese/" title="Duplicate">Japanese 2</a>
    `;
    const cats = parseCategories(html);
    assert.equal(cats.length, 2);
    assert.equal(cats[0].slug, 'japanese');
    assert.equal(cats[0].name, 'Japanese Adult');
    assert.equal(cats[1].slug, 'virtual-reality');
    assert.equal(cats[1].name, 'VR Porn');
  });

  await t.test('parseEpornerListing extracts listing cards and checks rel="next"', () => {
    const html = `
      <head>
        <link rel="next" href="/top-rated/2/" />
      </head>
      <div class="mb hdy">
        <p class="mbtit"><a href="/video-xyz999/super-title/">Super Video Title</a></p>
        <img data-src="https://static.eporner.com/thumb/xyz.jpg" />
        <span class="mbtim">12:30</span>
        <span class="mbvie">125,000</span>
      </div>
    `;
    const listing = parseEpornerListing(html);
    assert.equal(listing.hasNext, true);
    assert.equal(listing.videos.length, 1);
    assert.equal(listing.videos[0].id, 'xyz999');
    assert.equal(listing.videos[0].title, 'Super Video Title');
    assert.equal(listing.videos[0].thumb, 'https://static.eporner.com/thumb/xyz.jpg');
    assert.equal(listing.videos[0].duration, '12:30');
    assert.equal(listing.videos[0].views, 125000);
  });
});

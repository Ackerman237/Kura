import test from 'node:test';
import assert from 'node:assert/strict';

// Import or define the mergeUnifiedFeed algorithm
import { mergeUnifiedFeed } from '../../src/web/services/unifiedFeed.js';

test('Issue 7 - mergeUnifiedFeed combines multi-provider results with Promise.allSettled and deduplicates by title and type', async () => {
  const mockHtvPromise = Promise.resolve([
    { title: 'Attack on Titan OVA', type: 'anime', thumb: 'htv-aot.jpg', slug: 'aot-ova-htv', provider: 'htv' },
    { title: 'Solo Leveling Episode 1', type: 'anime', thumb: 'htv-sl.jpg', slug: 'sl-ep-1', provider: 'htv' },
  ]);

  const mockNekoPromise = Promise.resolve([
    // Duplicate title & type with HTV
    { title: 'Attack on Titan OVA', type: 'anime', thumb: 'neko-aot.jpg', slug: 'aot-ova-neko', provider: 'neko' },
    { title: 'Naruto Shippuden Ep 500', type: 'anime', thumb: 'neko-naruto.jpg', slug: 'naruto-500', provider: 'neko' },
  ]);

  // One provider rejects/fails (e.g. timeout or error)
  const mockTubePromise = Promise.reject(new Error('Network timeout'));

  const unifiedList = await mergeUnifiedFeed([
    { provider: 'htv', fetcher: () => mockHtvPromise },
    { provider: 'neko', fetcher: () => mockNekoPromise },
    { provider: 'tube', fetcher: () => mockTubePromise },
  ]);

  // Should not throw even when tube fails (Promise.allSettled tolerance)
  assert.ok(Array.isArray(unifiedList), 'Must return an array');

  // Total unique titles:
  // 1. "Attack on Titan OVA" (merged: 2 sources)
  // 2. "Solo Leveling Episode 1" (1 source)
  // 3. "Naruto Shippuden Ep 500" (1 source)
  assert.equal(unifiedList.length, 3, 'Should deduplicate items with identical title and type');

  const mergedAot = unifiedList.find((v) => v.title === 'Attack on Titan OVA');
  assert.ok(mergedAot, 'Attack on Titan OVA should be in list');
  assert.equal(mergedAot.sources.length, 2, 'Attack on Titan OVA should have 2 sources (htv and neko)');
  assert.deepEqual(
    mergedAot.sources.map((s) => s.provider).sort(),
    ['htv', 'neko']
  );
});

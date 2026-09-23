import test from 'node:test';
import assert from 'node:assert/strict';
import { saveReadingProgress, getReadingProgress } from '../../src/web/services/storage.js';

test('Issue 1 - Storage Reading Progress must persist thumb/cover image', () => {
  // Mock localStorage
  const store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };

  const testSlug = 'manga-test-slug';
  const testCover = 'https://res.cloudinary.com/demo/image/upload/cover.jpg';
  
  saveReadingProgress(testSlug, {
    chapterId: 'ch-1',
    chapterNumber: 1,
    pageIndex: 5,
    title: 'Test Manga',
    thumb: testCover,
    cover: testCover,
  });

  const progress = getReadingProgress(testSlug);
  assert.ok(progress, 'Progress object should exist');
  assert.equal(progress.mangaSlug, testSlug);
  assert.equal(progress.title, 'Test Manga');
  assert.ok(progress.thumb || progress.cover, 'Progress MUST save thumb or cover property');
  assert.equal(progress.thumb || progress.cover, testCover);
});

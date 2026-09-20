import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appVuePath = path.resolve(__dirname, '../../src/web/App.vue');
const navPath = path.resolve(__dirname, '../../src/web/composables/useNavigation.js');
const swPath = path.resolve(__dirname, '../../src/web/sw.js');

test('Issue 3 - useNavigation or App.vue must encode provider in URL search params for video-watch and video-home', () => {
  const appContent = fs.readFileSync(appVuePath, 'utf8');
  const navContent = fs.readFileSync(navPath, 'utf8');
  
  // Either useNavigation or App.vue must set 'provider' in URLSearchParams
  const setsProviderInUrl = (appContent.includes("url.searchParams.set('provider'") || navContent.includes("url.searchParams.set('provider'"));
  assert.equal(setsProviderInUrl, true, "URLSearchParams must persist 'provider' query param when navigating video views");
});

test('Issue 3 - App.vue onMounted must restore videoProvider from URL query param (e.g. ?provider=neko or ?provider=tube)', () => {
  const appContent = fs.readFileSync(appVuePath, 'utf8');
  const restoresProvider = appContent.includes("params.get('provider')");
  assert.equal(restoresProvider, true, "App.vue onMounted must read params.get('provider') to restore active provider on refresh");
});

test('Issue 3 - Service Worker sw.js must use ignoreSearch: true when matching SPA navigation requests', () => {
  const swContent = fs.readFileSync(swPath, 'utf8');
  const hasIgnoreSearch = swContent.includes('ignoreSearch');
  assert.equal(hasIgnoreSearch, true, 'sw.js cache matching for SPA routes must use ignoreSearch: true');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appVuePath = path.resolve(__dirname, '../../src/web/App.vue');

test('Issue 6 - App.vue related-videos must prioritize detail.related or match current provider instead of hardcoded htv videoList', () => {
  const appContent = fs.readFileSync(appVuePath, 'utf8');
  // It should use detail.related or a computed provider-isolated list rather than raw videoList.filter
  const hasProviderIsolatedRelated =
    appContent.includes('detail?.related') ||
    appContent.includes('videoDetailData?.related') ||
    appContent.includes('computedRelatedVideos') ||
    appContent.includes('activeRelatedVideos');
  assert.equal(
    hasProviderIsolatedRelated,
    true,
    'App.vue must provide provider-isolated related videos (prioritizing detail.related)'
  );
});

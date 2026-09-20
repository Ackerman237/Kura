import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const playerFramePath = path.resolve(__dirname, '../../src/server/routes/playerFrame.js');
const watchPlayerPath = path.resolve(__dirname, '../../src/web/components/video-watch/WatchPlayerContainer.vue');

test('Issue 2 - playerFrame.js must NOT monkeypatch XMLHttpRequest.prototype.open which breaks nhplayer anti-tamper', () => {
  const content = fs.readFileSync(playerFramePath, 'utf8');
  const hasXhrMonkeypatch = content.includes('XMLHttpRequest.prototype.open');
  assert.equal(hasXhrMonkeypatch, false, 'playerFrame.js should not tamper with XMLHttpRequest.prototype.open');
});

test('Issue 2 - WatchPlayerContainer.vue must support direct mount for trusted players (nhplayer, playmogo, streampoi)', () => {
  const content = fs.readFileSync(watchPlayerPath, 'utf8');
  // Check that trusted player hosts are recognized and mounted directly or without sandbox blocking same-origin
  const hasDirectHostCheck = content.includes('nhplayer.com') || content.includes('isDirectPlayer') || content.includes('playerAllowedHosts');
  assert.equal(hasDirectHostCheck, true, 'WatchPlayerContainer must recognize trusted hosts like nhplayer.com for direct mounting');
});

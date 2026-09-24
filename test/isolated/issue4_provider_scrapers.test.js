import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const httpPath = path.resolve(__dirname, '../../src/http.js');
const epornerClientPath = path.resolve(__dirname, '../../src/sources/eporner/client.js');
const videoRoutesPath = path.resolve(__dirname, '../../src/server/routes/video.js');

test('Issue 4 - src/http.js must support DNS over HTTPS (DoH) resolution fallback to bypass DNS poisoning', () => {
  const content = fs.readFileSync(httpPath, 'utf8');
  const hasDoh = content.includes('cloudflare-dns.com') || content.includes('resolveDoh') || content.includes('dns-query');
  assert.equal(hasDoh, true, 'src/http.js must include DoH resolver logic for handling blocked/poisoned domains');
});

test('Issue 4 - eporner client must use official https://www.eporner.com/api/v2 base URL', () => {
  const content = fs.readFileSync(epornerClientPath, 'utf8');
  assert.ok(
    content.includes("'https://www.eporner.com/api/v2'") || content.includes('"https://www.eporner.com/api/v2"'),
    'DEFAULT_API_BASE in eporner/client.js must point to https://www.eporner.com/api/v2'
  );
});

test('Issue 4 - src/server/routes/video.js must provide a /trending endpoint supporting provider selection', () => {
  const content = fs.readFileSync(videoRoutesPath, 'utf8');
  const hasTrendingRoute = content.includes("'/trending'") || content.includes('"/trending"');
  assert.equal(hasTrendingRoute, true, 'video.js must have a /trending route for cross-provider trending feeds');
});

test('Issue 4 - NekoPoi search query must be forwarded to the server scraper route', () => {
  const content = fs.readFileSync(videoRoutesPath, 'utf8');
  assert.equal(content.includes('req.query.q'), true, 'NekoPoi route must read the server-side search query');
  assert.equal(content.includes('scrapeNekoList(page, query)'), true, 'NekoPoi route must forward query to the scraper facade');
});

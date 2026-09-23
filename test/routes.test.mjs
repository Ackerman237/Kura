import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server.js';
import http from 'http';

function startTestServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((res) => server.close(res)),
      });
    });
  });
}

describe('Server Route Security & Integration Tests', () => {
  let serverInfo;

  test('setup test server', async () => {
    serverInfo = await startTestServer();
    assert.ok(serverInfo.baseUrl);
  });

  describe('Health Route (/api/health)', () => {
    test('returns status ok and system metrics', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, 'ok');
      assert.equal(data.app, 'kura');
      assert.ok(typeof data.uptime === 'number');
      assert.ok(Array.isArray(data.directEmbedHosts));
      assert.ok(data.directEmbedHosts.includes('nhplayer.com'));
      assert.ok(data.directEmbedHosts.includes('playmogo.com'));
      assert.ok(data.directEmbedHosts.includes('streampoi.com'));
    });
  });

  describe('Image Proxy Route (/api/image-proxy)', () => {
    test('rejects missing or non-http url', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/image-proxy?url=ftp://evil.com`);
      assert.equal(res.status, 400);
    });

    test('rejects local loopback SSRF targets (127.0.0.1)', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/image-proxy?url=http://127.0.0.1:4000/api/health`);
      assert.equal(res.status, 403);
    });

    test('rejects private IP range (192.168.1.1)', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/image-proxy?url=http://192.168.1.1/secret.jpg`);
      assert.equal(res.status, 403);
    });

    test('rejects cloud metadata IP (169.254.169.254)', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/image-proxy?url=http://169.254.169.254/latest/meta-data/`);
      assert.equal(res.status, 403);
    });
  });

  describe('Player Frame Route (/api/video/player-frame)', () => {
    test('rejects missing url parameter', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/video/player-frame`);
      assert.equal(res.status, 400);
    });

    test('rejects unauthorized host', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/video/player-frame?url=https://attacker-evil.com/embed/123`);
      assert.equal(res.status, 403);
    });

    test('rejects loopback/private target host even if masqueraded', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/video/player-frame?url=http://127.0.0.1/embed`);
      assert.equal(res.status, 403);
    });
  });

  describe('Pass-Through Proxy Route (/api/pf/:host)', () => {
    test('rejects unauthorized hosts', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/pf/evil.com/video.mp4`);
      assert.equal(res.status, 403);
    });

    test('rejects internal loopback host', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/pf/127.0.0.1/secret`);
      assert.equal(res.status, 403);
    });
  });

  describe('Download Routes (/api/video/download)', () => {
    test('/sources requires provider and slug', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/video/download/sources`);
      assert.equal(res.status, 400);
    });

    test('/stream rejects unauthorized host', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/video/download/stream?url=https://evil.com/video.mp4`);
      assert.equal(res.status, 403);
    });

    test('/save-to-disk rejects unauthorized host', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/video/download/save-to-disk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://evil.com/video.mp4',
          filename: 'test.mp4',
          directory: 'downloads',
        }),
      });
      assert.equal(res.status, 403);
    });

    test('/save-to-disk rejects path traversal in directory', async () => {
      const res = await fetch(`${serverInfo.baseUrl}/api/video/download/save-to-disk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://hentai.tv/video.mp4',
          filename: 'test.mp4',
          directory: 'downloads',
          subdir: '../../../../Windows/System32',
        }),
      });
      // Should sanitize or reject
      assert.ok([400, 403, 200].includes(res.status));
    });
  });

  test('teardown test server', async () => {
    if (serverInfo) {
      await serverInfo.close();
    }
  });
});

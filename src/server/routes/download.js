import express from 'express';
import path from 'path';
import { createWriteStream, mkdirSync, promises as fsPromises } from 'fs';
import { randomUUID } from 'crypto';
import { scrapeEpornerDetail } from '../../eporner.js';
import { scrapeHentaiSources } from '../../sources/hentaitv/downloader.js';
import { scrapeNekoSources } from '../../sources/nekopoi/downloader.js';
import { fetchThroughProxy } from '../../proxy.js';
import { isSafeExternalUrl } from '../../security.js';

const router = express.Router();

// Whitelist of allowed upstream video hosts
const DOWNLOAD_ALLOWED_HOSTS = [
  'www.eporner.com',
  'eporner.com',
  'streamtape.com',
  'www.streamtape.com',
  'doodstream.com',
  'www.doodstream.com',
  'dood.re',
  'streampoi.com',
  'playmogo.com',
  'hentai.tv',
  'nekopoi.care',
];

// In-memory job store for server-disk save mode progress (SSE)
const diskJobs = new Map();

/**
 * GET /api/video/download/sources?provider=tube|htv|neko&slug=...
 * Returns direct download sources [{label, url}] for a video.
 */
router.get('/sources', async (req, res) => {
  const { provider, slug } = req.query;
  if (!provider || !slug) {
    return res.status(400).json({ error: 'Parameter provider dan slug diperlukan' });
  }

  try {
    let result = { sources: [], title: '', provider };

    if (provider === 'tube') {
      const detail = await scrapeEpornerDetail(slug);
      result.title = detail.title || slug;
      result.sources = (detail.src || []).map((s) => ({
        label: s.label || 'original',
        url: s.url,
      }));
    } else if (provider === 'htv') {
      const { sources, title } = await scrapeHentaiSources(slug);
      result.title = title;
      result.sources = sources;
    } else if (provider === 'neko') {
      const { sources, title } = await scrapeNekoSources(slug);
      result.title = title;
      result.sources = sources;
    } else {
      return res.status(400).json({ error: `Provider '${provider}' tidak dikenal` });
    }

    if (result.sources.length === 0) {
      return res.json({ ...result, message: 'Unduhan langsung tidak tersedia untuk video ini.' });
    }

    return res.json(result);
  } catch (err) {
    console.error('[Download Sources]', err.message);
    return res.status(502).json({ error: err.message });
  }
});

/**
 * GET /api/video/download/stream?url=...&filename=...
 * Proxies remote video with Range header support for browser direct download.
 */
router.get('/stream', async (req, res) => {
  const { url: rawUrl, filename } = req.query;
  if (!rawUrl) return res.status(400).send('Parameter url diperlukan');

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return res.status(400).send('URL tidak valid');
  }

  if (!DOWNLOAD_ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    return res.status(403).send(`Host '${parsedUrl.hostname}' tidak diizinkan untuk diunduh`);
  }

  const isSafe = await isSafeExternalUrl(parsedUrl.href);
  if (!isSafe) {
    return res.status(403).send('Target video host tidak diizinkan (private/loopback address)');
  }

  try {
    const safeFilename = (filename || 'kura-video.mp4')
      .replace(/[/\\:*?"<>|]/g, '_')
      .replace(/\s+/g, ' ')
      .trim();

    const rangeHeader = req.headers.range;
    const upstreamHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      Referer: `${parsedUrl.protocol}//${parsedUrl.hostname}/`,
      Accept: 'video/mp4,video/*,*/*;q=0.8',
    };
    if (rangeHeader) upstreamHeaders.Range = rangeHeader;

    const isProxyNeeded = parsedUrl.hostname.includes('eporner.com') || parsedUrl.hostname.includes('nekopoi');
    const fetchFn = isProxyNeeded ? fetchThroughProxy : fetch;

    const upstreamRes = await fetchFn(rawUrl, {
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(60000),
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return res.status(upstreamRes.status).send(`Gagal mengambil video: HTTP ${upstreamRes.status}`);
    }

    const contentType = upstreamRes.headers.get('content-type') || 'video/mp4';
    const contentLength = upstreamRes.headers.get('content-length');
    const contentRange = upstreamRes.headers.get('content-range');
    const acceptRanges = upstreamRes.headers.get('accept-ranges') || 'bytes';

    res.setHeader('Content-Type', contentType);
    if (req.query.inline === '1') {
      res.setHeader('Content-Disposition', 'inline');
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    }
    res.setHeader('Accept-Ranges', acceptRanges);
    res.setHeader('Cache-Control', 'no-store');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);

    res.status(upstreamRes.status);

    const reader = upstreamRes.body.getReader();
    const writeChunk = async () => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); break; }
        const canContinue = res.write(Buffer.from(value));
        if (!canContinue) {
          await new Promise((r) => res.once('drain', r));
        }
      }
    };

    req.on('close', () => reader.cancel().catch(() => {}));
    await writeChunk();
  } catch (err) {
    if (!res.headersSent) res.status(502).send(`Stream error: ${err.message}`);
  }
});

/**
 * POST /api/video/download/save-to-disk
 * Saves a video directly to the server's filesystem.
 */
router.post('/save-to-disk', express.json(), async (req, res) => {
  const { url: rawUrl, filename, directory, subdir } = req.body || {};
  if (!rawUrl || !filename || !directory) {
    return res.status(400).json({ error: 'url, filename, dan directory diperlukan' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'URL tidak valid' });
  }

  if (!DOWNLOAD_ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    return res.status(403).json({ error: `Host '${parsedUrl.hostname}' tidak diizinkan` });
  }

  const isSafe = await isSafeExternalUrl(parsedUrl.href);
  if (!isSafe) {
    return res.status(403).json({ error: 'Target host tidak diizinkan (private/loopback address)' });
  }

  const safeFilename = filename.replace(/[/\\:*?"<>|]/g, '_').trim();
  const safeSubdir = subdir ? subdir.replace(/[*?"<>|]/g, '_').trim() : '';

  const BASE_DOWNLOAD_DIR = process.env.KURA_DOWNLOAD_DIR || path.join(process.cwd(), 'downloads');
  const finalDir = safeSubdir
    ? path.join(BASE_DOWNLOAD_DIR, safeSubdir)
    : BASE_DOWNLOAD_DIR;
  const finalPath = path.join(finalDir, safeFilename);

  const resolvedBase = path.resolve(BASE_DOWNLOAD_DIR);
  const resolvedFinal = path.resolve(finalPath);

  if (!resolvedFinal.startsWith(resolvedBase + path.sep) && resolvedFinal !== resolvedBase) {
    return res.status(403).json({ error: 'Path output tidak diizinkan' });
  }

  const jobId = randomUUID();
  diskJobs.set(jobId, { status: 'downloading', progress: 0, filename: safeFilename, error: null });

  res.json({ jobId, finalPath });

  (async () => {
    try {
      mkdirSync(finalDir, { recursive: true });

      const upstreamRes = await fetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: `${parsedUrl.protocol}//${parsedUrl.hostname}/`,
        },
        signal: AbortSignal.timeout(60000 * 30),
      });

      if (!upstreamRes.ok) throw new Error(`HTTP ${upstreamRes.status}`);

      const total = Number(upstreamRes.headers.get('content-length') || 0);
      let received = 0;

      const writeStream = createWriteStream(finalPath);
      const reader = upstreamRes.body.getReader();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        writeStream.write(Buffer.from(value));
        received += value.length;
        if (total > 0) {
          diskJobs.get(jobId).progress = Math.round((received / total) * 100);
        }
      }

      await new Promise((resolve, reject) => {
        writeStream.end();
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      diskJobs.get(jobId).status = 'done';
      diskJobs.get(jobId).progress = 100;
    } catch (err) {
      const job = diskJobs.get(jobId);
      if (job) { job.status = 'error'; job.error = err.message; }
      console.error('[Save-to-Disk]', err.message);
      try {
        await fsPromises.unlink(finalPath);
      } catch (_) {}
    }
  })();
});

/**
 * GET /api/video/download/progress/:jobId
 * Server-Sent Events stream for server-disk download progress.
 */
router.get('/progress/:jobId', (req, res) => {
  const { jobId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const interval = setInterval(() => {
    const job = diskJobs.get(jobId);
    if (!job) {
      send({ status: 'not_found' });
      clearInterval(interval);
      res.end();
      return;
    }
    send(job);
    if (job.status === 'done' || job.status === 'error') {
      clearInterval(interval);
      res.end();
      diskJobs.delete(jobId);
    }
  }, 500);

  req.on('close', () => clearInterval(interval));
});

export default router;

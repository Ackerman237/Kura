import './src/env.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  scrapeMangaList,
  scrapeMangaDetail,
  scrapeChapterImages,
  scrapeGenres,
} from './src/doujindesu.js';
import {
  scrapeNekoList,
  scrapeNekoDetail,
  scrapeNekoCategory,
} from './src/nekopoi.js';
import {
  scrapeHentaiList,
  scrapeHentaiDetail,
  scrapeHentaiTrending,
  scrapeHentaiGenres,
  scrapeHentaiGenre,
} from './src/hentaitv.js';
import {
  scrapeEpornerList,
  scrapeEpornerDetail,
  scrapeEpornerListingPage,
  scrapeEpornerCategories,
  scrapeEpornerCategory,
} from './src/eporner.js';
import { scrapeHentaiSources } from './src/sources/hentaitv/downloader.js';
import { scrapeNekoSources } from './src/sources/nekopoi/downloader.js';
import { createWriteStream, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json());

// --------------------------------------------------------------------------
// 1. MANGA API ROUTES (Doujindesu)
// --------------------------------------------------------------------------
app.get('/api/manga/list', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    const type = req.query.type && req.query.type !== 'all' ? req.query.type : undefined;
    const genre = req.query.genre && req.query.genre !== 'all' ? req.query.genre : undefined;
    const sort = req.query.sort || undefined;
    const query = req.query.q || undefined;
    const data = await scrapeMangaList({ page, limit, type, query, genre, sort, withMeta: true });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/manga/genres', async (_req, res) => {
  try {
    const data = await scrapeGenres();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/manga/detail/:slug', async (req, res) => {
  try {
    const data = await scrapeMangaDetail(req.params.slug);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/manga/chapter/:id', async (req, res) => {
  try {
    const data = await scrapeChapterImages(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// 2. VIDEO API ROUTES (NekoPoi, Hentai.tv, Eporner)
// --------------------------------------------------------------------------
app.get('/api/video/neko/list', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const data = await scrapeNekoList(page);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/video/neko/detail/:slug', async (req, res) => {
  try {
    const data = await scrapeNekoDetail(req.params.slug);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/video/htv/genres', async (_req, res) => {
  try {
    const data = await scrapeHentaiGenres();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/video/htv/list', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const query = req.query.q || undefined;
    const genre = req.query.genre && req.query.genre !== 'all' ? req.query.genre : undefined;
    let data;
    if (genre) {
      data = await scrapeHentaiGenre(genre, page);
    } else {
      data = await scrapeHentaiList({ page, query });
    }
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/video/htv/detail/:slug', async (req, res) => {
  try {
    const data = await scrapeHentaiDetail(req.params.slug);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/video/tube/categories', async (_req, res) => {
  try {
    const data = await scrapeEpornerCategories();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/video/tube/list', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const query = req.query.q || undefined;
    const category = req.query.category && req.query.category !== 'all' ? req.query.category : undefined;
    let data;
    if (category) {
      data = await scrapeEpornerCategory(category, page);
    } else {
      data = await scrapeEpornerList({ page, query });
    }
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/video/tube/detail/:id', async (req, res) => {
  try {
    const data = await scrapeEpornerDetail(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// 3. VIDEO DOWNLOAD ROUTES (Source Extraction + Stream Proxy)
// --------------------------------------------------------------------------

// Allowed domains for download proxy (whitelist for security)
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
 * Returns a list of direct download sources [{label, url}] for a video.
 */
app.get('/api/video/download/sources', async (req, res) => {
  const { provider, slug } = req.query;
  if (!provider || !slug) {
    return res.status(400).json({ error: 'Parameter provider dan slug diperlukan' });
  }

  try {
    let result = { sources: [], title: '', provider };

    if (provider === 'tube') {
      // Eporner — already has src[] from API
      const detail = await scrapeEpornerDetail(slug);
      result.title = detail.title || slug;
      result.sources = (detail.src || []).map((s) => ({
        label: s.label || 'original',
        url: s.url,
      }));
    } else if (provider === 'htv') {
      // HentaiTV — embed chain extraction
      const { sources, title } = await scrapeHentaiSources(slug);
      result.title = title;
      result.sources = sources;
    } else if (provider === 'neko') {
      // NekoPoi — embed chain (StreamTape, DoodStream, etc.)
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
 * Proxies a remote video URL to the browser as a download (Content-Disposition).
 * Supports Range header for resume capability.
 */
app.get('/api/video/download/stream', async (req, res) => {
  const { url: rawUrl, filename } = req.query;
  if (!rawUrl) return res.status(400).send('Parameter url diperlukan');

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return res.status(400).send('URL tidak valid');
  }

  // Security: only allow whitelisted hosts
  if (!DOWNLOAD_ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    return res.status(403).send(`Host '${parsedUrl.hostname}' tidak diizinkan untuk diunduh`);
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

    const upstreamRes = await fetch(rawUrl, {
      headers: upstreamHeaders,
      signal: AbortSignal.timeout(30000),
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return res.status(upstreamRes.status).send(`Gagal mengambil video: HTTP ${upstreamRes.status}`);
    }

    // Forward relevant headers
    const contentType = upstreamRes.headers.get('content-type') || 'video/mp4';
    const contentLength = upstreamRes.headers.get('content-length');
    const contentRange = upstreamRes.headers.get('content-range');
    const acceptRanges = upstreamRes.headers.get('accept-ranges') || 'bytes';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Accept-Ranges', acceptRanges);
    res.setHeader('Cache-Control', 'no-store');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);

    res.status(upstreamRes.status);

    // Stream body directly to response (no buffering in memory)
    const reader = upstreamRes.body.getReader();
    const writeChunk = async () => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); break; }
        const canContinue = res.write(Buffer.from(value));
        if (!canContinue) {
          // Back-pressure: wait for drain before reading more
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
 * Body: { url, filename, directory, subdir? }
 * Returns: { jobId } — use GET /api/video/download/progress/:jobId for SSE updates.
 */
app.post('/api/video/download/save-to-disk', express.json(), async (req, res) => {
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

  const safeFilename = filename.replace(/[/\\:*?"<>|]/g, '_').trim();
  const safeSubdir = subdir ? subdir.replace(/[*?"<>|]/g, '_').trim() : '';

  // Resolve final output path (restrict to configured base dir)
  const BASE_DOWNLOAD_DIR = process.env.KURA_DOWNLOAD_DIR || path.join(process.cwd(), 'downloads');
  const finalDir = safeSubdir
    ? path.join(BASE_DOWNLOAD_DIR, safeSubdir)
    : BASE_DOWNLOAD_DIR;
  const finalPath = path.join(finalDir, safeFilename);

  // Prevent path traversal
  if (!finalPath.startsWith(BASE_DOWNLOAD_DIR)) {
    return res.status(403).json({ error: 'Path output tidak diizinkan' });
  }

  const jobId = randomUUID();
  diskJobs.set(jobId, { status: 'downloading', progress: 0, filename: safeFilename, error: null });

  res.json({ jobId, finalPath });

  // Start download in background (non-blocking)
  (async () => {
    try {
      mkdirSync(finalDir, { recursive: true });

      const upstreamRes = await fetch(rawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: `${parsedUrl.protocol}//${parsedUrl.hostname}/`,
        },
        signal: AbortSignal.timeout(60000 * 30), // 30 min timeout
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
    }
  })();
});

/**
 * GET /api/video/download/progress/:jobId
 * Server-Sent Events stream for server-disk download progress.
 */
app.get('/api/video/download/progress/:jobId', (req, res) => {
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
      diskJobs.delete(jobId); // cleanup
    }
  }, 500);

  req.on('close', () => clearInterval(interval));
});

// --------------------------------------------------------------------------
// 4. VIDEO PLAYER FRAME PROXY & SHIELD (Kura Anti-Ad & Sandbox)
// --------------------------------------------------------------------------
const execFileAsync = promisify(execFile);

async function curlGetText(url, referer) {
  try {
    const args = [
      '-s',
      '-L',
      '--compressed',
      '--max-time',
      '15',
      '-H',
      'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      '-H',
      'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      '-H',
      'Accept-Language: id,en-US;q=0.9,en;q=0.8',
    ];
    if (referer) {
      args.push('-H', `Referer: ${referer}`);
    }
    args.push(url);
    const { stdout } = await execFileAsync('curl.exe', args, { maxBuffer: 10 * 1024 * 1024 });
    return stdout;
  } catch (err) {
    console.warn(`[curl fallback warning] ${err.message}`);
    return null;
  }
}

const AD_DOMAINS = [
  'hikerfaquirs.com',
  'wearadmiration.com',
  'tsyndicate.com',
  'badlandlispyippee.com',
  'propellerads',
  'popads',
  'blockadsnot.com',
  'adsterra',
  'histats',
  'yandex.ru',
  'googlesyndication.com',
  'doubleclick.net',
  'adnxs.com',
  'exoclick.com',
  'trafficjunky.com',
  'juicyads.com',
  'etahub.com',
  'onclickperf.com',
  'highperformancegate.com',
  'monetag.com',
];

const INLINE_AD_PATTERNS = [
  /The publisher doesnt allow adblock/i,
  /\/embedblocked\?referer=/i,
  /DisableDevtool/i,
  /popundersPerIP/i,
  /hbvqq\(/i,
  /"AGFzbQE/i,
  /ad_url/i,
  /openPopup/i,
];

function stripAdScripts(rawHtml) {
  let html = rawHtml;

  // 1. Remove script tags with src matching known ad networks
  AD_DOMAINS.forEach((domain) => {
    const regex = new RegExp(`<script[^>]*src=["'][^"']*${domain}[^"']*["'][^>]*>\\s*<\\/script>`, 'gi');
    html = html.replace(regex, '');
  });

  // 2. Strip inline script blocks that match aggressive anti-adblock or popunder patterns
  html = html.replace(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi, (match, content) => {
    for (const pattern of INLINE_AD_PATTERNS) {
      if (pattern.test(content)) {
        return '';
      }
    }
    return match;
  });

  // 3. Neutralize direct window.open or popunders inside inline code
  html = html.replace(/window\.open\s*\(/gi, 'void(');
  html = html.replace(/DisableDevtool/gi, '__disabled_detector__');
  html = html.replace(/popundersPerIP/gi, '__disabled_popunder__');

  return html;
}

function generatePlayerShim(targetUrl, originHost) {
  return `
    <base href="${targetUrl}">
    <style>
      html, body {
        background-color: #000000 !important;
        color: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        width: 100% !important;
        height: 100% !important;
      }
      video { width: 100% !important; height: 100% !important; object-fit: contain !important; }
      iframe { width: 100% !important; height: 100% !important; border: 0 !important; }
      .frame { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000; }
      .header, .servers, .alert, .adbox, #adbox, .ads, [class*="ad-banner"] { display: none !important; }
      .play {
        position: absolute;
        z-index: 10;
        cursor: pointer;
        width: 64px !important;
        height: 64px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(0,0,0,0.75) !important;
        border-radius: 50% !important;
        border: 2px solid rgba(255,255,255,0.85) !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
      }
      .play svg, svg {
        max-width: 32px !important;
        max-height: 32px !important;
        width: 32px !important;
        height: 32px !important;
        fill: #ffffff !important;
      }
      .backdrop {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        opacity: 0.5;
      }
      /* Hide floating ad banners and click-jack transparent overlays */
      [id*="ad_"], [class*="ad_"], [class*="banner"], [id*="banner"],
      [class*="popup"]:not([class*="player"]), [id*="popup"]:not([id*="player"]),
      div[style*="z-index: 999999"], div[style*="z-index:999999"],
      div[style*="z-index: 2147483647"], div[style*="z-index:2147483647"] {
        display: none !important;
        pointer-events: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
    </style>
    <script>
      (function() {
        // 1. Spoof referrer & anti-adblock flags
        try {
          Object.defineProperty(document, 'referrer', {
            get: function() { return '${targetUrl}'; },
            configurable: true
          });
        } catch(e) {}
        window.hab = false;
        window.adblock = false;
        window.canRunAds = true;

        // 2. Kill popup and popunder APIs
        try {
          window.open = function() { return null; };
          window.alert = function() {};
          window.confirm = function() { return true; };
          window.prompt = function() { return null; };
        } catch(e) {}

        // 3. Block popunder / malicious clicks in capture phase
        document.addEventListener('click', function(ev) {
          var a = ev.target && ev.target.closest ? ev.target.closest('a') : null;
          if (a) {
            var href = a.getAttribute('href') || '';
            var target = a.getAttribute('target') || '';
            if (target === '_blank' || (href.startsWith('http') && !href.includes('${originHost}')) || href.startsWith('javascript:')) {
              ev.preventDefault();
              ev.stopPropagation();
              return false;
            }
          }
        }, true);

        // 4. Block unauthorized form submissions
        document.addEventListener('submit', function(ev) {
          var form = ev.target;
          var action = form ? form.getAttribute('action') || '' : '';
          if (action.startsWith('http') && !action.includes('${originHost}')) {
            ev.preventDefault();
            ev.stopPropagation();
            return false;
          }
        }, true);

        // 5. Intercept XMLHttpRequest to rewrite relative ajax calls to pass-through proxy
        var origXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
          if (typeof url === 'string') {
            if (url.startsWith('/')) {
              url = '/api/pf/${originHost}' + url;
            } else if (url.startsWith('./')) {
              url = '/api/pf/${originHost}/' + url.slice(2);
            }
          }
          return origXhrOpen.call(this, method, url, async === undefined ? true : async, user, pass);
        };
      })();
    </script>
  `;
}

app.get('/api/video/player-frame', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('Parameter url diperlukan');
  }

  try {
    const parsed = new URL(targetUrl);
    const originHost = parsed.hostname;
    let html = null;

    // Step 1: Try native fetch first
    try {
      const upstreamRes = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          Referer: targetUrl,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        },
      });
      if (upstreamRes.ok) {
        html = await upstreamRes.text();
      }
    } catch (_) {}

    // Step 2: Fallback to curl.exe if blocked (e.g. Cloudflare 403 TLS fingerprint)
    if (!html || html.includes('Cloudflare') || html.includes('Checking your browser')) {
      const curlHtml = await curlGetText(targetUrl, targetUrl);
      if (curlHtml) {
        html = curlHtml;
      }
    }

    if (!html) {
      return res.status(502).send('Gagal mengambil iframe dari penyedia video');
    }

    // Step 3: Strip ads and anti-adblock traps
    html = stripAdScripts(html);

    // Step 4: Inject stealth and guard shims
    const guardShim = generatePlayerShim(targetUrl, originHost);
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${guardShim}`);
    } else if (html.includes('</head>')) {
      html = html.replace('</head>', `${guardShim}</head>`);
    } else {
      html = guardShim + html;
    }

    // Step 5: Send with CSP sandbox (opaque origin, allows scripts, forms, presentation without popups)
    res.setHeader('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-presentation');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.type('html').send(html);
  } catch (err) {
    res.status(502).send(`Gagal menyaring player frame: ${err.message}`);
  }
});

// Pass-through proxy for relative assets and AJAX endpoints requested by the embedded player
app.use('/api/pf/:host', async (req, res) => {
  const host = req.params.host;
  const subpath = req.url.startsWith('/') ? req.url.slice(1) : req.url;
  const targetUrl = `https://${host}/${subpath}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        Referer: `https://${host}/`,
        Origin: `https://${host}`,
        Accept: req.headers.accept || '*/*',
      },
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    const buffer = await upstreamRes.arrayBuffer();
    return res.status(upstreamRes.status).send(Buffer.from(buffer));
  } catch (err) {
    return res.status(502).send(`Pass-through error: ${err.message}`);
  }
});

// --------------------------------------------------------------------------
// 4. IMAGE PROXY ENDPOINT (Anti-Hotlink Bypass for Manga Pages)
// --------------------------------------------------------------------------
app.get('/api/image-proxy', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
    return res.status(400).send('Valid image url required');
  }

  try {
    const parsed = new URL(imageUrl);
    const upstreamRes = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        Referer: `${parsed.protocol}//${parsed.hostname}/`,
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send(`Failed upstream fetch: ${upstreamRes.statusText}`);
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

    const arrayBuffer = await upstreamRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(502).send(`Proxy error: ${err.message}`);
  }
});

// --------------------------------------------------------------------------
// 4. HEALTHCHECK & SYSTEM MONITORING
// --------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'kura',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    node: process.version,
  });
});

// --------------------------------------------------------------------------
// 5. PWA ASSETS & STATIC FRONTEND SERVING
// --------------------------------------------------------------------------
const DIST_DIR = path.join(__dirname, 'dist');

// Explicit PWA Service Worker & Manifest routes with correct MIME types
app.get('/sw.js', (_req, res) => {
  res.type('application/javascript').sendFile(path.join(__dirname, 'src', 'web', 'sw.js'));
});

app.get('/manifest.json', (_req, res) => {
  res.type('application/manifest+json').sendFile(path.join(__dirname, 'src', 'web', 'manifest.json'));
});

app.use(express.static(DIST_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

// SPA Fallback: All unhandled routes return dist/index.html
app.use((_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Start Server & Graceful Shutdown
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`[Kura] Server aktif berjalan di http://localhost:${PORT}`);
  });

  const handleShutdown = (signal) => {
    console.log(`\n[Kura] Menerima sinyal ${signal}. Menutup server secara graceful...`);
    if (server) {
      server.close(() => {
        console.log('[Kura] Server HTTP berhasil ditutup. Keluar.');
        process.exit(0);
      });
      setTimeout(() => {
        console.error('[Kura] Penutupan server melebihi batas waktu 10s. Memaksa keluar.');
        process.exit(1);
      }, 10000).unref();
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

export default app;

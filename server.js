import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
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
} from './src/hentaitv.js';
import {
  scrapeEpornerList,
  scrapeEpornerDetail,
  scrapeEpornerListingPage,
} from './src/eporner.js';

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
    const type = req.query.type || 'manga';
    const query = req.query.q || undefined;
    const data = await scrapeMangaList({ page, limit, type, query });
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

app.get('/api/video/htv/list', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const query = req.query.q || undefined;
    const data = await scrapeHentaiList({ page, query });
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

app.get('/api/video/tube/list', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const query = req.query.q || undefined;
    const data = await scrapeEpornerList({ page, query });
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
// 3. TIER 2 VIDEO PLAYER FRAME PROXY (Anti-Popunder & CSP Sandbox)
// --------------------------------------------------------------------------
const AD_DOMAINS = [
  'hikerfaquirs.com',
  'wearadmiration.com',
  'tsyndicate.com',
  'badlandlispyippee.com',
  'propellerads',
  'popads',
  'blockadsnot.com',
];

app.get('/api/video/player-frame', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('Parameter url diperlukan');
  }

  try {
    const parsed = new URL(targetUrl);
    const originHost = parsed.hostname;

    // Fetch upstream embed HTML
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        Referer: targetUrl,
      },
    });

    let html = await upstreamRes.text();

    // 1. Strip external ad scripts
    AD_DOMAINS.forEach((domain) => {
      const regex = new RegExp(`<script[^>]*src=["'][^"']*${domain}[^"']*["'][^>]*>\\s*<\\/script>`, 'gi');
      html = html.replace(regex, '');
    });

    // 2. Neutralize inline adblock traps
    html = html.replace(/DisableDevtool/gi, '__disabled_detector__');
    html = html.replace(/popundersPerIP/gi, '__disabled_popunder__');

    // 3. Inject guardShim before </head> or at beginning
    const guardShim = `
      <script>
        try { window.open = function() { return null; }; } catch(e) {}
        document.addEventListener('click', function(ev) {
          var a = ev.target && ev.target.closest ? ev.target.closest('a') : null;
          if (!a) return;
          var isExternal = /^https?:\\/\\//i.test(a.href) && !a.href.includes('${originHost}');
          if (a.target === '_blank' || isExternal) {
            ev.preventDefault();
            ev.stopPropagation();
          }
        }, true);
      </script>
    `;

    if (html.includes('</head>')) {
      html = html.replace('</head>', `${guardShim}</head>`);
    } else {
      html = guardShim + html;
    }

    // 4. Send with strict CSP sandbox (No top navigation, No same origin, No popups)
    res.setHeader('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-presentation');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.type('html').send(html);
  } catch (err) {
    res.status(502).send(`Gagal menyaring player frame: ${err.message}`);
  }
});

// --------------------------------------------------------------------------
// 4. STATIC FRONTEND SERVING
// --------------------------------------------------------------------------
const DIST_DIR = path.join(__dirname, 'dist');
app.use(express.static(DIST_DIR));

// SPA Fallback: All unhandled routes return dist/index.html
app.use((_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Kura] Server aktif berjalan di http://localhost:${PORT}`);
  });
}

export default app;

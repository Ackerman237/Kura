import express from 'express';
import { Readable } from 'stream';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fetchThroughProxy } from '../../proxy.js';
import { safeHttpUrl, isSafeExternalUrl } from '../../security.js';
import { safeFetch, readTextLimited, MAX_RESPONSE_BYTES_HTML } from '../../http.js';

const execFileAsync = promisify(execFile);
const router = express.Router();

const ALLOWED_PLAYER_HOSTS = [
  'nhplayer.com',
  'playmogo.com',
  'streampoi.com',
  'eporner.com',
  'www.eporner.com',
  'streamtape.com',
  'doodstream.com',
  'dood.re',
  'mega.nz',
  'yandex.ru',
  'ok.ru',
  'hentai.tv',
  'nekopoi.care',
  'doujindesu.tv',
];

function isHostAllowed(hostname) {
  if (!hostname || typeof hostname !== 'string') return false;
  const h = hostname.toLowerCase();
  return ALLOWED_PLAYER_HOSTS.some((allowed) => h === allowed || h.endsWith(`.${allowed}`));
}

async function curlGetText(url, referer) {
  try {
    const isSafe = await isSafeExternalUrl(url);
    if (!isSafe) return null;

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
    const { stdout } = await execFileAsync('curl', args, { maxBuffer: MAX_RESPONSE_BYTES_HTML });
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
  'bowsguaka.cfd',
  'df6pt2obl092n.cloudfront.net',
  'dobytowsy.com',
  'runative-syndicate.com',
  'tollwayrealive.cyou',
  'pxltag.com',
  'uuidksinc.net',
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
  /adblock/i,
  /AdBlock/i,
  /block adblock/i,
  /ad blockers/i,
  /please disable adblock/i,
  /adblocker/i,
];

function stripAdScripts(rawHtml, originHost = '') {
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

  // 4. For providers whose CDNs are blocked by local ISPs (like Eporner), rewrite asset domains to pass-through proxy
  if (originHost && originHost.includes('eporner.com')) {
    html = html.replace(/https?:\/\/(static-[a-z0-9\-]+\.eporner\.com|static\.eporner\.com)/gi, '/api/pf/$1');
    html = html.replace(/https?:\/\/www\.eporner\.com/gi, '/api/pf/www.eporner.com');
    html = html.replace(/https?:\/\/([a-z0-9\-]+\.eporner\.com)/gi, '/api/pf/$1');
  }

  return html;
}

function generatePlayerShim(targetUrl, originHost) {
  const safeTargetUrl = JSON.stringify(targetUrl).slice(1, -1).replace(/</g, '\\u003c');
  const safeOriginHost = JSON.stringify(originHost).slice(1, -1).replace(/</g, '\\u003c');
  const baseHref = originHost.includes('eporner.com')
    ? `/api/pf/www.eporner.com/`
    : targetUrl.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `
    <base href="${baseHref}">
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
      .header, .servers, .alert, .adbox, #adbox, .ads, [class*="ad-banner"], #header, #footer, .top-banner, .under-player-ads { display: none !important; }
      #EPvideo, .video-js, #player, .player {
        width: 100% !important;
        height: 100% !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
      }
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
      [data-cl-overlay], div[class*="ovwr"], div[class*="overlay"]:not(.vjs-overlay),
      div[style*="z-index: 999999"], div[style*="z-index:999999"],
      div[style*="z-index: 2147483647"], div[style*="z-index:2147483647"] {
        display: none !important;
        pointer-events: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
      }
    </style>
    <script>
      (function() {
        // 1. Spoof referrer & anti-adblock flags
        try {
          Object.defineProperty(document, 'referrer', {
            get: function() { return '${safeTargetUrl}'; },
            configurable: true
          });
        } catch(e) {}
        window.hab = false;
        window.adblock = false;
        window.canRunAds = true;

        // 1b. Mock analytics & ad tracking APIs to prevent Video.js player crashes (e.g. Doodstream/Playmogo)
        window.sendGA = function() {};
        window.ga = function() {};
        window.gtag = function() {};
        window._gaq = [];

        // 1c. Mock localStorage, sessionStorage, and cookie for sandboxed frames
        try {
          var _mem = {};
          var fakeStorage = {
            getItem: function(k) { return _mem[k] || null; },
            setItem: function(k, v) { _mem[k] = String(v); },
            removeItem: function(k) { delete _mem[k]; },
            clear: function() { _mem = {}; },
            key: function(i) { return Object.keys(_mem)[i] || null; },
            get length() { return Object.keys(_mem).length; }
          };
          Object.defineProperty(window, 'localStorage', {
            get: function() { return fakeStorage; },
            configurable: true
          });
          Object.defineProperty(window, 'sessionStorage', {
            get: function() { return fakeStorage; },
            configurable: true
          });
        } catch(e) {}
        try {
          var _cookies = '';
          Object.defineProperty(document, 'cookie', {
            get: function() { return _cookies; },
            set: function(v) { _cookies = v; },
            configurable: true
          });
        } catch(e) {}

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
            if (target === '_blank' || (href.startsWith('http') && !href.includes('${safeOriginHost}')) || href.startsWith('javascript:')) {
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
          if (action.startsWith('http') && !action.includes('${safeOriginHost}')) {
            ev.preventDefault();
            ev.stopPropagation();
            return false;
          }
        }, true);
      })();
    </script>
  `;
}

// GET /api/video/player-frame?url=...
router.get('/player-frame', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('Parameter url diperlukan');
  }

  const cleanUrl = safeHttpUrl(targetUrl);
  if (!cleanUrl) {
    return res.status(400).send('URL target tidak valid atau dilarang');
  }

  try {
    const parsed = new URL(cleanUrl);
    const originHost = parsed.hostname;

    if (!isHostAllowed(originHost)) {
      return res.status(403).send(`Host '${originHost}' tidak diizinkan untuk player frame`);
    }

    const isSafe = await isSafeExternalUrl(cleanUrl);
    if (!isSafe) {
      return res.status(403).send('Target host player tidak diizinkan (private/loopback address)');
    }

    let html = null;

    // Step 0: For Eporner embeds, prioritize proxy pool to avoid ISP DNS-poisoning / TLS reset
    if (originHost.includes('eporner.com')) {
      try {
        const proxyRes = await fetchThroughProxy(cleanUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            Referer: 'https://www.eporner.com/',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        if (proxyRes.ok) {
          html = await readTextLimited(proxyRes, MAX_RESPONSE_BYTES_HTML);
        }
      } catch (err) {
        console.warn(`[playerFrame] fetchThroughProxy error for eporner:`, err.message);
      }
    }

    // Step 1: Try safe fetch if not already loaded
    if (!html) {
      try {
        const upstreamRes = await safeFetch(cleanUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            Referer: cleanUrl,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          },
        });
        if (upstreamRes.ok) {
          html = await readTextLimited(upstreamRes, MAX_RESPONSE_BYTES_HTML);
        }
      } catch (_) {}
    }

    // Step 2: Fallback to curl if blocked (Cloudflare 403 TLS fingerprint)
    if (!html || html.includes('Cloudflare') || html.includes('Checking your browser')) {
      const curlHtml = await curlGetText(cleanUrl, cleanUrl);
      if (curlHtml) {
        html = curlHtml;
      }
    }

    // Step 3: Fallback to proxy pool if still blocked
    if (!html) {
      try {
        const proxyRes = await fetchThroughProxy(cleanUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            Referer: cleanUrl,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        if (proxyRes.ok) {
          html = await readTextLimited(proxyRes, MAX_RESPONSE_BYTES_HTML);
        }
      } catch (_) {}
    }

    if (!html) {
      return res.status(502).send('Gagal mengambil iframe dari penyedia video');
    }

    // Step 3: Strip ads and anti-adblock traps
    html = stripAdScripts(html, originHost);

    // Step 4: Inject stealth and guard shims
    const guardShim = generatePlayerShim(cleanUrl, originHost);
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${guardShim}`);
    } else if (html.includes('</head>')) {
      html = html.replace('</head>', `${guardShim}</head>`);
    } else {
      html = guardShim + html;
    }

    // Step 5: Send with CSP sandbox
    res.setHeader('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-presentation allow-same-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.type('html').send(html);
  } catch (err) {
    res.status(502).send(`Gagal menyaring player frame: ${err.message}`);
  }
});

// Pass-through proxy for relative assets and AJAX endpoints requested by the embedded player
// Mounted at /api/pf/:host
router.use('/pf/:host', async (req, res) => {
  const host = req.params.host;
  if (!isHostAllowed(host)) {
    return res.status(403).send(`Host '${host}' tidak diizinkan untuk pass-through`);
  }

  const subpath = req.url.startsWith('/') ? req.url.slice(1) : req.url;
  const targetUrl = `https://${host}/${subpath}`;

  const isSafe = await isSafeExternalUrl(targetUrl);
  if (!isSafe) {
    return res.status(403).send('Target pass-through host tidak diizinkan (private/loopback address)');
  }

  try {
    const fetchFn = (host.includes('eporner.com') || host.includes('nekopoi'))
      ? fetchThroughProxy
      : safeFetch;

    const reqHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      Referer: `https://${host}/`,
      Origin: `https://${host}`,
      Accept: req.headers.accept || '*/*',
    };
    if (req.headers.range) {
      reqHeaders.Range = req.headers.range;
    }

    const upstreamRes = await fetchFn(targetUrl, {
      method: req.method,
      headers: reqHeaders,
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control']) {
      const val = upstreamRes.headers.get(h);
      if (val) res.setHeader(h, val);
    }

    res.status(upstreamRes.status);
    if (upstreamRes.body) {
      Readable.fromWeb(upstreamRes.body).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    if (!res.headersSent) {
      return res.status(502).send(`Pass-through error: ${err.message}`);
    }
  }
});

export default router;

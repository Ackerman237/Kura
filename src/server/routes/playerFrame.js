import express from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const router = express.Router();

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

    // Step 2: Fallback to curl.exe if blocked (Cloudflare 403 TLS fingerprint)
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

export default router;

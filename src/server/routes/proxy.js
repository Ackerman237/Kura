import express from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fetchThroughProxy } from '../../proxy.js';
import { safeHttpUrl, isSafeExternalUrl } from '../../security.js';
import { safeFetch } from '../../http.js';

const execFileAsync = promisify(execFile);
const router = express.Router();

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB max for proxied images

async function fetchWithCurlDoH(url, referer) {
  try {
    const isSafe = await isSafeExternalUrl(url);
    if (!isSafe) return null;

    const args = [
      '-s',
      '-L',
      '--doh-url',
      'https://cloudflare-dns.com/dns-query',
      '--max-time',
      '15',
      '-H',
      'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      '-H',
      'Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    ];
    if (referer) {
      args.push('-H', `Referer: ${referer}`);
    }
    args.push(url);
    const { stdout } = await execFileAsync('curl', args, {
      encoding: 'buffer',
      maxBuffer: MAX_IMAGE_BYTES,
    });
    return stdout;
  } catch (err) {
    console.warn(`[curl DoH proxy fallback error] ${err.message}`);
    return null;
  }
}

/**
 * GET /api/image-proxy?url=...
 * Anti-Hotlink Bypass & CDN ISP Poisoning Protection (via DoH & Proxy Pool)
 */
router.get('/image-proxy', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
    return res.status(400).send('Valid image url required');
  }

  const cleanUrl = safeHttpUrl(imageUrl);
  if (!cleanUrl) {
    return res.status(400).send('Invalid or forbidden image url');
  }

  const isSafe = await isSafeExternalUrl(cleanUrl);
  if (!isSafe) {
    return res.status(403).send('Target image host is private or forbidden');
  }

  try {
    const parsed = new URL(cleanUrl);
    let referer = `${parsed.protocol}//${parsed.hostname}/`;
    const isEporner = parsed.hostname.includes('eporner');
    if (parsed.hostname.includes('desu.pics') || parsed.hostname.includes('doujin')) {
      referer = 'https://doujindesu.tv/';
    } else if (parsed.hostname.includes('nekopoi')) {
      referer = 'https://nekopoi.care/';
    } else if (parsed.hostname.includes('hentai.tv')) {
      referer = 'https://hentai.tv/';
    } else if (isEporner) {
      referer = 'https://www.eporner.com/';
    }

    // For Eporner CDN, prioritize proxy pool directly to avoid ISP DNS-poisoning timeouts
    if (isEporner) {
      try {
        const proxyRes = await fetchThroughProxy(cleanUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
            Referer: referer,
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        });
        if (proxyRes.ok) {
          const cl = Number(proxyRes.headers.get('content-length') || 0);
          if (cl > MAX_IMAGE_BYTES) {
            return res.status(413).send('Image too large');
          }
          const contentType = proxyRes.headers.get('content-type') || 'image/jpeg';
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
          const arrayBuffer = await proxyRes.arrayBuffer();
          if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
            return res.status(413).send('Image too large');
          }
          return res.send(Buffer.from(arrayBuffer));
        }
      } catch (_) {}
    }

    // Attempt 1: Safe fetch with DNS rebinding & loopback protection
    try {
      const upstreamRes = await safeFetch(cleanUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          Referer: referer,
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (upstreamRes.ok) {
        const cl = Number(upstreamRes.headers.get('content-length') || 0);
        if (cl > MAX_IMAGE_BYTES) {
          return res.status(413).send('Image too large');
        }
        const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        const arrayBuffer = await upstreamRes.arrayBuffer();
        if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
          return res.status(413).send('Image too large');
        }
        return res.send(Buffer.from(arrayBuffer));
      }
    } catch (_) {}

    // Attempt 2: DoH Fallback for ISP DNS-poisoned CDNs
    const dohBuffer = await fetchWithCurlDoH(cleanUrl, referer);
    if (dohBuffer && dohBuffer.length > 0) {
      if (dohBuffer.length > MAX_IMAGE_BYTES) {
        return res.status(413).send('Image too large');
      }
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      return res.send(dohBuffer);
    }

    // Attempt 3: Proxy pool general fallback
    try {
      const proxyRes = await fetchThroughProxy(cleanUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          Referer: referer,
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });
      if (proxyRes.ok) {
        const cl = Number(proxyRes.headers.get('content-length') || 0);
        if (cl > MAX_IMAGE_BYTES) {
          return res.status(413).send('Image too large');
        }
        const contentType = proxyRes.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        const arrayBuffer = await proxyRes.arrayBuffer();
        if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
          return res.status(413).send('Image too large');
        }
        return res.send(Buffer.from(arrayBuffer));
      }
    } catch (_) {}

    return res.status(502).send('Failed upstream image fetch (standard, DoH, and proxy pool failed)');
  } catch (err) {
    return res.status(502).send(`Proxy error: ${err.message}`);
  }
});

export default router;

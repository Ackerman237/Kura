import express from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const router = express.Router();

async function fetchWithCurlDoH(url, referer) {
  try {
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
    const { stdout } = await execFileAsync('curl.exe', args, {
      encoding: 'buffer',
      maxBuffer: 20 * 1024 * 1024,
    });
    return stdout;
  } catch (err) {
    console.warn(`[curl DoH proxy fallback error] ${err.message}`);
    return null;
  }
}

/**
 * GET /api/image-proxy?url=...
 * Anti-Hotlink Bypass & CDN ISP Poisoning Protection (via DoH)
 */
router.get('/image-proxy', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
    return res.status(400).send('Valid image url required');
  }

  try {
    const parsed = new URL(imageUrl);
    let referer = `${parsed.protocol}//${parsed.hostname}/`;
    if (parsed.hostname.includes('desu.pics') || parsed.hostname.includes('doujin')) {
      referer = 'https://doujindesu.tv/';
    } else if (parsed.hostname.includes('nekopoi')) {
      referer = 'https://nekopoi.care/';
    } else if (parsed.hostname.includes('hentai.tv')) {
      referer = 'https://hentai.tv/';
    } else if (parsed.hostname.includes('eporner')) {
      referer = 'https://www.eporner.com/';
    }

    // Attempt 1: Standard fetch
    try {
      const upstreamRes = await fetch(imageUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          Referer: referer,
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (upstreamRes.ok) {
        const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        const arrayBuffer = await upstreamRes.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
      }
    } catch (_) {}

    // Attempt 2: DoH Fallback for ISP DNS-poisoned CDNs (e.g. Eporner CDN)
    const dohBuffer = await fetchWithCurlDoH(imageUrl, referer);
    if (dohBuffer && dohBuffer.length > 0) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      return res.send(dohBuffer);
    }

    return res.status(502).send('Failed upstream image fetch (standard & DoH failed)');
  } catch (err) {
    return res.status(502).send(`Proxy error: ${err.message}`);
  }
});

export default router;

/**
 * Kura Service Worker
 * PWA Caching Strategy:
 * - App Shell & Static assets: Stale-While-Revalidate
 * - Dynamic API routes: Network-First
 */

const CACHE_NAME = 'kura-app-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

const IMAGE_CACHE_NAME = 'kura-images-v1';
const MAX_IMAGE_CACHE_ITEMS = 600;

async function pruneCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const itemsToDelete = keys.slice(0, keys.length - maxItems);
      for (const req of itemsToDelete) {
        await cache.delete(req);
      }
    }
  } catch (_) {}
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET, websocket, and chrome-extension requests
  if (event.request.method !== 'GET' || url.protocol.startsWith('chrome')) return;

  // 1. Image assets & Cover proxies: Cache-First
  const isImage =
    event.request.destination === 'image' ||
    /\.(?:png|jpg|jpeg|webp|avif|gif|svg)$/i.test(url.pathname) ||
    url.pathname.includes('/image-proxy') ||
    url.pathname.includes('/proxy-img');

  if (isImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        try {
          const networkRes = await fetch(event.request);
          if (networkRes && networkRes.status === 200) {
            cache.put(event.request, networkRes.clone()).catch(() => {});
            pruneCache(IMAGE_CACHE_NAME, MAX_IMAGE_CACHE_ITEMS).catch(() => {});
          }
          return networkRes;
        } catch (_) {
          return cached || new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // 2. API routes: Network-First with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Static / SPA App Shell: Stale-While-Revalidate
  const isHtmlNav = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');
  const matchOptions = isHtmlNav ? { ignoreSearch: true } : undefined;

  event.respondWith(
    caches.match(event.request, matchOptions).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is an HTML navigation, return cached index.html
          if (isHtmlNav) {
            return caches.match('/index.html', { ignoreSearch: true }) || caches.match('/');
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});

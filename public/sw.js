/* EduSpare service worker
 *
 * Strategy:
 *  - Hashed Next.js chunks, fonts and /assets: cache-first (immutable).
 *  - HTML navigations: network-first with an offline fallback to the last
 *    cached shell, so the app opens instantly on repeat visits and still
 *    renders when the connection drops.
 *  - /api/*: never cached here (the app has its own ETag / polling logic).
 */
const VERSION = 'v1';
const STATIC_CACHE = `eduspare-static-${VERSION}`;
const PAGE_CACHE = `eduspare-pages-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => ![STATIC_CACHE, PAGE_CACHE].includes(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

const isStatic = (url) =>
  url.origin === self.location.origin &&
  (url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/assets/') ||
    /\.(woff2?|ttf|png|jpe?g|webp|svg|ico|webmanifest)$/.test(url.pathname));

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return; // always live

  if (isStatic(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGE_CACHE);
        try {
          const res = await fetch(request);
          if (res.ok) cache.put('/', res.clone());
          return res;
        } catch {
          const cached = await cache.match('/');
          return (
            cached ||
            new Response('<h1 style="font-family:system-ui;padding:2rem">You are offline</h1>', {
              headers: { 'Content-Type': 'text/html' },
            })
          );
        }
      })()
    );
  }
});

// Kaynos Docs service worker — cache-first for fonts, network-first for HTML.
// Bump VERSION on any deploy where you want clients to drop their old caches.
const VERSION = '2026-05-14-2';
const CACHE = 'kaynos-docs-' + VERSION;
const PRECACHE = [
  '/',
  '/fonts/fonts.css',
  '/fonts/inter-latin.woff2',
  '/fonts/jetbrains-mono-latin.woff2',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Same-origin GETs only — cross-origin (e.g. external link previews) bypass.
  if (url.origin !== location.origin) return;
  if (event.request.method !== 'GET') return;

  // Network-first for navigations and HTML — keeps content fresh; falls
  // back to the cached root when offline so the SPA still boots and routes.
  const isHtml = event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html');
  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match('/')))
    );
    return;
  }

  // Cache-first for static assets (fonts, images). Populate cache on miss.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});

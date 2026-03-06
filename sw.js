const CACHE_NAME = 'ts-muscle-v22';
const ASSETS = ['./index.html', './icon.png', './icon-192.png', './manifest.json'];

// On install: precache all app assets so the app works fully offline
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
});

// On activate: delete old caches from previous versions
self.addEventListener('activate', e => {
  e.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  ]));
});

// On fetch: network first, fall back to cache so app loads after restart with no internet.
// For HTML requests use cache:'no-store' to bypass the browser's HTTP cache — without this
// the browser's own cache can silently serve a stale index.html, preventing version banners.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isHTML = e.request.destination === 'document' ||
    e.request.url.endsWith('.html') ||
    new URL(e.request.url).pathname === '/';
  const req = isHTML ? new Request(e.request, { cache: 'no-store' }) : e.request;
  e.respondWith(
    fetch(req).then(response => {
      if (response && response.status === 200 && response.type !== 'opaque') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone)).catch(() => {});
      }
      return response;
    }).catch(() => caches.match(e.request).then(r => r || new Response('', { status: 503 })))
  );
});

const CACHE_NAME = 'ts-muscle-v11';
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

// On fetch: network first, fall back to cache so app loads after restart with no internet
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(response => {
      if (response && response.status === 200 && response.type !== 'opaque') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone)).catch(() => {});
      }
      return response;
    }).catch(() => caches.match(e.request).then(r => r || new Response('', { status: 503 })))
  );
});

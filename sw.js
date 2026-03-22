const CACHE_NAME = 'ts-muscle-v46';
const ASSETS = ['./index.html', './exercise-library.js', './icon.png', './icon-192.png', './manifest.json'];

// On install: precache all app assets so the app works fully offline
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
});

// Allow the page to trigger skipWaiting when the user taps the update banner
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
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
// config.js is always fetched fresh — it is served by a Netlify Edge Function that injects
// the API key at runtime. It must never be served from cache.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // config.js / supabase-config.js: always network, never cache.
  // These are Netlify Edge Functions that inject env vars at runtime.
  if (e.request.url.includes('config.js')) {
    const isSupabase = e.request.url.includes('supabase-config.js');
    e.respondWith(
      fetch(new Request(e.request, { cache: 'no-store' }))
        .catch(() => new Response(
          isSupabase
            ? "window.SUPABASE_URL = ''; window.SUPABASE_PUBLISHABLE_KEY = '';"
            : "window.ANTHROPIC_API_KEY = '';",
          { status: 200, headers: { 'content-type': 'application/javascript' } }
        ))
    );
    return;
  }

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

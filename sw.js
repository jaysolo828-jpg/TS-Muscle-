// OneSignal service worker — must be imported before our handlers so OneSignal
// can manage its own push subscription lifecycle.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE_NAME = 'ts-muscle-v73';
const ASSETS = ['./index.html', './exercise-library.js', './supabase.min.js', './icon.png', './icon-192.png', './manifest.json'];

// On install: precache all app assets so the app works fully offline.
// skipWaiting() makes the new SW take over immediately rather than waiting
// for all tabs to close — this unblocks users stuck on a broken cached page.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  // Do NOT call skipWaiting() here — let the banner prompt the user to refresh
});

// Allow the page to trigger skipWaiting when the user taps the update banner
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// On activate: claim all clients and delete old caches.
// skipWaiting() above makes the new SW take over immediately, which fires
// the controllerchange event in the page — the page's controllerchange
// handler calls window.location.reload() to pick up new assets cleanly.
self.addEventListener('activate', e => {
  e.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  ]));
});

// Handle notification action button taps.
// When a user taps the 👍 "Nice work" button on a workout notification, we read
// their Supabase user ID from IndexedDB (stored by the page on sign-in) and POST
// to /record-reaction server-side — no app window is opened.
self.addEventListener('notificationclick', function(event) {
  const action = event.action;
  const data   = event.notification.data || {};

  if (action === 'thumbs_up' && data.signal_id && data.to_user_id) {
    event.notification.close();
    event.waitUntil(
      new Promise(function(resolve) {
        var req = indexedDB.open('ts-muscle-sw', 1);
        req.onupgradeneeded = function(e) { e.target.result.createObjectStore('meta'); };
        req.onsuccess = function(e) {
          var db = e.target.result;
          var get = db.transaction('meta', 'readonly').objectStore('meta').get('userId');
          get.onsuccess = function() {
            var fromUserId = get.result;
            if (!fromUserId) { resolve(); return; }
            fetch('/record-reaction', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                from_user_id: fromUserId,
                to_user_id:   data.to_user_id,
                signal_id:    data.signal_id,
                reaction_type: 'thumbs_up'
              })
            }).then(resolve).catch(resolve);
          };
          get.onerror = resolve;
        };
        req.onerror = resolve;
      })
    );
    return; // Do not open the app window for this action
  }

  // Default tap — focus or open the app
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cs) {
      var c = cs.find(function(x) { return 'focus' in x; });
      if (c) return c.focus();
      return clients.openWindow('/');
    })
  );
});

// On fetch: network first, fall back to cache so app loads after restart with no internet.
// For HTML requests use cache:'no-store' to bypass the browser's HTTP cache — without this
// the browser's own cache can silently serve a stale index.html, preventing version banners.
// config.js is always fetched fresh — it is served by a Netlify Edge Function that injects
// the API key at runtime. It must never be served from cache.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // config.js / supabase-config.js / onesignal-config.js: always network, never cache.
  // These are Netlify Edge Functions that inject env vars at runtime.
  if (e.request.url.includes('config.js')) {
    const isSupabase  = e.request.url.includes('supabase-config.js');
    const isOneSignal = e.request.url.includes('onesignal-config.js');
    e.respondWith(
      fetch(new Request(e.request, { cache: 'no-store' }))
        .catch(() => new Response(
          isSupabase  ? "window.SUPABASE_URL = ''; window.SUPABASE_PUBLISHABLE_KEY = '';" :
          isOneSignal ? "window.ONESIGNAL_APP_ID = '';" :
                        "window.ANTHROPIC_API_KEY = '';",
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

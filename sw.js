const CACHE_NAME = 'ts-muscle-v252';
const _SW_BASE = new URL('./', self.location.href).href;
const ASSETS = ['./index.html', './exercise-library.js', './supabase.min.js', './icon.png', './icon-192.png', './badge-dumbbell.png', './manifest.json'];

// On install: precache assets and immediately take over so users always get
// the latest code without needing to tap an update banner.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
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

// Display incoming push notifications.
// Pre-fetch the avatar icon so we can fall back to the app logo if the URL fails to load.
self.addEventListener('push', function(event) {
  if (!event.data) return;
  var data = {};
  try { data = event.data.json(); } catch(e) { data = { title: event.data.text(), body: '' }; }
  var title = data.title || 'T&S Muscle';
  var fallbackIcon = 'https://app.therapyandsneakers.org/icon-192.png';
  var avatarUrl    = data.icon || null;

  var iconPromise = avatarUrl
    ? fetch(avatarUrl).then(function(r) { return r.ok ? avatarUrl : fallbackIcon; }).catch(function() { return fallbackIcon; })
    : Promise.resolve(fallbackIcon);

  event.waitUntil(
    iconPromise.then(function(resolvedIcon) {
      var options = {
        body: data.body || '',
        icon: resolvedIcon,
        // White silhouette dumbbell — used by Chrome for the small
        // status-bar glyph. Without this Chrome falls back to its own
        // generic icon, which reads as "a Chrome notification" instead
        // of a native-looking T&S notification.
        badge: '/badge-dumbbell.png',
        data: data.data || {},
        requireInteraction: false,
      };
      if (data.data && data.data.signal_id) {
        options.actions = [{ action: 'thumbs_up', title: '👍 Nice work' }];
      }
      return self.registration.showNotification(title, options);
    })
  );
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

  // Default tap — focus existing window or open the TWA/app. If the push
  // carries to_user_id + signal_id, deep-link to the reactions sheet:
  //   - new window: open URL with ?open_friend=X&signal_id=Y query params
  //   - existing window on our origin: postMessage so the already-loaded
  //     page opens the sheet without navigating
  event.notification.close();
  var toUid = data.to_user_id;
  var sigId = data.signal_id;
  var qs = (toUid && sigId)
    ? '?open_friend=' + encodeURIComponent(toUid) + '&signal_id=' + encodeURIComponent(sigId)
    : '';
  var targetUrl = 'https://app.therapyandsneakers.org/' + qs;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cs) {
      // Prefer a window already on our origin
      var ourClient = cs.find(function(x) { return x.url.startsWith(_SW_BASE) && 'focus' in x; });
      if (ourClient) {
        if (toUid) {
          try {
            ourClient.postMessage({
              type: 'OPEN_FRIEND_ACTIVITY',
              to_user_id: toUid,
              signal_id: sigId || null
            });
          } catch(_) {}
        }
        return ourClient.focus();
      }
      var anyClient = cs.find(function(x) { return 'focus' in x; });
      if (anyClient) return anyClient.focus();
      // openWindow with the exact launch URL so Android routes it to the TWA
      return clients.openWindow(targetUrl);
    })
  );
});

// On fetch:
// - config.js files (Netlify Edge Functions with injected env vars): always network, never cache.
// - API endpoints (no file extension, not HTML): always network, never cache.
// - HTML navigation requests: stale-while-revalidate — serve cached index.html immediately
//   so the app opens without a Chrome loading screen after overnight, then update cache
//   in the background. The SW update mechanism (new cache name → controllerchange → reload)
//   handles delivering new versions, so serving stale HTML on first paint is safe.
// - All other same-origin assets (JS, images, etc.): cache-first with network fallback.
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

  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/';

  // API endpoints (no file extension, not HTML): always network, never cache.
  const hasExtension = /\.[a-zA-Z0-9]+(\?|$)/.test(url.pathname);
  if (!hasExtension && !isHTML) {
    e.respondWith(
      fetch(new Request(e.request, { cache: 'no-store' }))
        .catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  if (isHTML) {
    // Stale-while-revalidate for navigation: return cached index.html immediately
    // (no Chrome loading screen), fetch fresh copy in background to update cache.
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match('./index.html').then(cached => {
          const networkFetch = fetch(new Request(e.request, { cache: 'no-store' }))
            .then(resp => {
              if (resp && resp.status === 200) cache.put('./index.html', resp.clone());
              return resp;
            })
            .catch(() => null);
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // All other same-origin assets: cache-first, network fallback.
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type !== 'opaque') {
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, resp.clone())).catch(() => {});
        }
        return resp;
      }).catch(() => new Response('', { status: 503 }));
    })
  );
});

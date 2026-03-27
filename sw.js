const CACHE_NAME = 'ts-muscle-v194';
const _SW_BASE = new URL('./', self.location.href).href;
const ASSETS = ['./index.html', './exercise-library.js', './supabase.min.js', './icon.png', './icon-192.png', './notif-ts-icon.png', './manifest.json'];

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
self.addEventListener('push', function(event) {
  if (!event.data) return;
  var data = {};
  try { data = event.data.json(); } catch(e) { data = { title: event.data.text(), body: '' }; }
  var title = data.title || 'T&S Muscle';
  var options = {
    body: data.body || '',
    icon: data.icon || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAADxElEQVR42u3d61EqQRSFUWIgDSMwezPTCKAUmZnu861TtX9eLLr34sI84HYzl879fv+2CmZMmc+K1TaJooNhFB4Io/BAGKWHwSg9DEbxQTBKD4NRfBCM4oNgFB8ExRcQFF9AUH6BQPEFBMUXEJRfIFB+gUDxBQTlFwiUXyBQfAFB+QUC5RcIlF8gUH6BQPkFAuUXCJRfIFB+gUD5BQLlFwiUXyBQfoFA+QUCAAQA5RcIbJJkEdgcSSOwMZIFYFMki8BmSBaBTZA0AhsgWQAWX9IILLxkAVh0ySKw2JJGYKElC8AiSxqBBZYsAIsraQQWVrIALKqkEVhQyQKwmJJGYCElC8AiShqBBRQARIoALJ6kEbz6x74+P5bKFQu+23OYvlenlH+14l8BYbfnUNorAIa8ik4v/1H7dSiA1RfzDAQADAEwcTGPBrDb86juFwAAAACAt0DVz2yHHvv3IRiA7Q+JWlCHQafv1eFnf50Iu+ZE2H8eo7RXy17+sHKhV3/l/+tj7LjGhwPYpURFAM+e+yv/tgzgIQIA9njb9+rfBQCAUQCOhAMAAOPOgwDwBMBOJQIAgLcjAAAAAADInAQEAIAMgHefNAMAgO0vKQAAgOXL/9/Hdg3QLwHsViSv+OdcOlGAAED0qtf6vRsAhD7wAgCAa+jdwQeA8gMAwEAA7uADIIvALawAZAF4SwdAFgDUAGQRTLocwYdgl0Jkyw/AwKNAR6KZeEEaAABmy78EgB3fStQATL4k2f8AAKSvywcAgPRNKQAAkC0/AGEAAgAAAgAAAAAAAAAAuB/AYVAAAHAmGAAA5v7CpcuhAViqHG6IAWCrwvh+IwAAAGDm1yMCoPyX/V6wowIAAABA6nyAL8VaEMCjzdn1OLZDnwDIxieiEh+AAZD0D2RAILUs+UPZIgCIACByAQAIJF1+AAQACyQAiEQBQCDp8gMgAFgoKQOAQNLlB0AAsGBSBgCBpMsPgOQBQCDp8gMgAFhAKQOAQNLlB0DyACCQdPkBkDwACCRdfgAkDwACSZcfAMkDgEDS5QdA8gAgkHT5IZB8+QGQPAAIJF1+ACQPAAJJlx8CyZcfAsmXHwDJA4BA0uWHQPLlh0Dy5QdA8gAgkHT5IZB8+SGQfPkhkHz5IZB8+SGQfPkhkHz5IZB8+SGQfPkhkHz5IZCbgUD5DQTKb0BQfAOB8hsIlN+AoPgGAuU3ECi/AUHxDQiKbyBQfgOC4hsQFN+AoPgGBMU3ICi+gUHpDQiKb2BQegOD0psuCLtnUiDsjknAsNrvmR99ZMDfK65frQAAAABJRU5ErkJggg==',
    badge: _SW_BASE + 'icon-192.png',
    data: data.data || {},
    requireInteraction: false,
  };
  if (data.data && data.data.signal_id) {
    options.actions = [{ action: 'thumbs_up', title: '👍 Nice work' }];
  }
  event.waitUntil(self.registration.showNotification(title, options));
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
      return clients.openWindow(_SW_BASE);
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

  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/';

  // API endpoints (no file extension) are never cached — only serve from network.
  // This prevents stale HTML from being cached if an edge function didn't exist yet.
  const hasExtension = /\.[a-zA-Z0-9]+(\?|$)/.test(url.pathname);
  if (!hasExtension && !isHTML) {
    e.respondWith(
      fetch(new Request(e.request, { cache: 'no-store' }))
        .catch(() => new Response('', { status: 503 }))
    );
    return;
  }

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

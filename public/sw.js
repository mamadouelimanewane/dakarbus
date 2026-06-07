// SunuBus Service Worker — Offline-first avec cache intelligent
const CACHE_VERSION = 'sunubus-v9';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const API_CACHE     = `${CACHE_VERSION}-api`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  // Tuiles CartoDB pré-cachées pour zone Dakar (zoom 10-12)
  'https://a.basemaps.cartocdn.com/light_nolabels/11/926/810.png',
  'https://a.basemaps.cartocdn.com/light_nolabels/11/927/810.png',
  'https://a.basemaps.cartocdn.com/light_nolabels/11/926/811.png',
  'https://a.basemaps.cartocdn.com/light_nolabels/11/927/811.png',
  'https://a.basemaps.cartocdn.com/light_nolabels/10/463/405.png',
  'https://a.basemaps.cartocdn.com/light_nolabels/10/463/406.png',
];

// ── Install ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// ── Activate ──────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch strategies ──────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // OSRM / external API → Network first, fallback offline page
  if (url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(request)
        .then(res => {
          // Cache OSRM walking/driving results for 10 min
          if (url.hostname.includes('osrm') || url.hostname.includes('router.project-osrm')) {
            const clone = res.clone();
            caches.open(API_CACHE).then(c => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Map tiles → Cache-first (offline maps)
  if (url.hostname.includes('cartocdn') || url.hostname.includes('tile')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) caches.open(STATIC_CACHE).then(c => c.put(request, res.clone()));
          return res;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // App shell & assets → Stale-while-revalidate
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request).then(res => {
        if (res.ok) {
          caches.open(STATIC_CACHE).then(c => c.put(request, res.clone()));
        }
        return res;
      }).catch(() => cached); // network failed → serve cache

      // Return cached immediately if available, update in background
      return cached || fetchPromise;
    })
  );
});

// ── Background sync (future) ──────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reports') {
    // future: send queued reports to backend
    console.log('[SW] Background sync: reports');
  }
});

// ── Push notifications ────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'SunuBus', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'sunubus-alert',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(wClients => {
      if (wClients.length > 0) { wClients[0].focus(); return; }
      clients.openWindow('/');
    })
  );
});

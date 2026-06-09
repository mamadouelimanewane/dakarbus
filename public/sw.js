// SunuBus Service Worker — Offline-first avec cache intelligent
const CACHE_VERSION = 'sunubus-v11';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const TILE_CACHE    = `${CACHE_VERSION}-tiles`;
const API_CACHE     = `${CACHE_VERSION}-api`;

// ── Génère les tuiles CartoDB couvrant la région de Dakar ──────
// Coordonnées vérifiées : Dakar ~14.7°N / 17.4°W → z11 ≈ (924,939)
function dakarTiles() {
  const tiles = [];
  const s = ['a', 'b', 'c'];
  const sub = (x, y) => s[(x + y) % 3];
  const base = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png';
  const url  = (z, x, y) => base.replace('{s}', sub(x,y)).replace('{z}', z).replace('{x}', x).replace('{y}', y);

  // Zoom 10 — vue région (Dakar + banlieue)
  // x: 461-463, y: 469-471
  for (let x = 461; x <= 463; x++)
    for (let y = 469; y <= 471; y++)
      tiles.push(url(10, x, y));

  // Zoom 11 — vue ville entière
  // x: 922-926, y: 937-942
  for (let x = 922; x <= 926; x++)
    for (let y = 937; y <= 942; y++)
      tiles.push(url(11, x, y));

  // Zoom 12 — vue quartier (zone centrale Dakar + Plateau + Medina + Pikine)
  // x: 1845-1853, y: 1875-1885
  for (let x = 1845; x <= 1853; x++)
    for (let y = 1875; y <= 1885; y++)
      tiles.push(url(12, x, y));

  // Zoom 13 — vue rue (centre Dakar Plateau + Medina + Yoff + Parcelles)
  // x: 3692-3706, y: 3751-3769
  for (let x = 3692; x <= 3706; x++)
    for (let y = 3751; y <= 3769; y++)
      tiles.push(url(13, x, y));

  return tiles;
}

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  ...dakarTiles(),
];

// ── Install ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(TILE_CACHE).then(cache =>
      // addAll peut échouer si une tuile n'existe pas — on ignore les erreurs individuelles
      Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(() => { /* tuile absente, pas grave */ })
        )
      )
    )
  );
});

// ── Activate ──────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== TILE_CACHE && k !== API_CACHE)
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

  // ── Tuiles cartographiques → Cache-first (offline maps) ────
  if (url.hostname.includes('cartocdn') || url.hostname.includes('tile.openstreetmap')) {
    event.respondWith(
      caches.open(TILE_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(res => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          }).catch(() => new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // ── OSRM / APIs externes → Network first, fallback cache ──
  if (url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(request)
        .then(res => {
          // Met en cache les réponses OSRM valides pour 30 min
          if (url.hostname.includes('osrm') || url.hostname.includes('router.project-osrm') || url.hostname.includes('locationiq')) {
            const clone = res.clone();
            caches.open(API_CACHE).then(c => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request).then(c => c || new Response(JSON.stringify({ offline: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        })))
    );
    return;
  }

  // ── App shell & assets → Stale-while-revalidate ────────────
  event.respondWith(
    caches.open(STATIC_CACHE).then(cache =>
      cache.match(request).then(cached => {
        const fetchPromise = fetch(request).then(res => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});

// ── Background sync ───────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reports') {
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

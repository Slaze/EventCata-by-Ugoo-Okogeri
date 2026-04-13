const SW_VERSION = 'v7';
const APP_SHELL_CACHE = `eventcat-app-shell-${SW_VERSION}`;
const RUNTIME_CACHE = `eventcat-runtime-${SW_VERSION}`;
const TILE_CACHE = `eventcat-tiles-${SW_VERSION}`;
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/screens/body-content.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];
const RUNTIME_MAX_ENTRIES = 120;
const TILE_MAX_ENTRIES = 300;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => ![APP_SHELL_CACHE, RUNTIME_CACHE, TILE_CACHE].includes(key))
        .map((key) => caches.delete(key))
    );
    if ('navigationPreload' in self.registration) {
      await self.registration.navigationPreload.enable();
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isMapTileRequest(url) {
  return /tile|tiles|map|openstreetmap|maptiler|mapbox/i.test(url.href);
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const deletions = keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key));
  await Promise.all(deletions);
}

async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then(async (response) => {
    if (response && response.ok) {
      cache.put(request, response.clone());
      if (maxEntries) trimCache(cacheName, maxEntries);
    }
    return response;
  }).catch(() => null);
  return cached || networkPromise || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const preloadResponse = await event.preloadResponse;
      if (preloadResponse) return preloadResponse;
      try {
        return await fetch(request);
      } catch {
        const cache = await caches.open(APP_SHELL_CACHE);
        return (await cache.match('/index.html')) || (await cache.match('/'));
      }
    })());
    return;
  }

  if (sameOrigin && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.json'))) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE, RUNTIME_MAX_ENTRIES));
    return;
  }

  if (request.destination === 'image' || isMapTileRequest(url)) {
    const cacheName = isMapTileRequest(url) ? TILE_CACHE : RUNTIME_CACHE;
    const maxEntries = isMapTileRequest(url) ? TILE_MAX_ENTRIES : RUNTIME_MAX_ENTRIES;
    event.respondWith(staleWhileRevalidate(request, cacheName, maxEntries));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const network = await fetch(request);
      if (network && network.ok && sameOrigin) {
        cache.put(request, network.clone());
        trimCache(RUNTIME_CACHE, RUNTIME_MAX_ENTRIES);
      }
      return network;
    } catch {
      return cached || Response.error();
    }
  })());
});

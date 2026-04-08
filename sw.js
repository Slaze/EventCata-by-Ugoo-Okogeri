const CACHE_NAME = 'eventcat-cache-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/screenshots/app-screenshot.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Keep SPA usable offline for navigation requests.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('/index.html')) || (await cache.match('/'));
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(async (cached) => {
      if (cached) return cached;
      try {
        const network = await fetch(e.request);
        if (network && network.ok && new URL(e.request.url).origin === self.location.origin) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(e.request, network.clone());
        }
        return network;
      } catch {
        return cached;
      }
    })
  );
});

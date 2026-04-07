const CACHE_NAME = 'eventcat-cache-v1';
const ASSETS = [
  '/',
  '/EventCatabyUgooOkogeri.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/screenshot1.png',
  '/screenshot2.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
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
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});

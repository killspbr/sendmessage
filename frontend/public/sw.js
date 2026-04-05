const CACHE_NAME = 'cl-marketing-v5';

const urlsToCache = [
  '/',
  '/index.html',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event - clean ALL old caches and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );

      // Enable navigation preload if supported
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      // Take control immediately
      await self.clients.claim();

      // Notify all clients to reload
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: 'NEW_VERSION_AVAILABLE' });
      }
    })()
  );
});

// Fetch event - API always goes to network, pages use network-first with cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Skip API requests, chrome-extension, and non-http(s)
  if (event.request.url.includes('/api/')) return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    (async () => {
      // Try preload response first
      try {
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) return preloadResponse;
      } catch (e) {}

      // Network first
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // Fallback to cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        throw error;
      }
    })()
  );
});

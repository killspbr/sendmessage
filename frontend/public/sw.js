const CACHE_NAME = 'cl-marketing-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache essential files da nova versão
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache opened');
      return cache.addAll(urlsToCache);
    })
  );
  // Garante que o novo SW seja ativado imediatamente, sem esperar as abas antigas
  self.skipWaiting();
});

// Activate event - clean old caches e notificar clientes sobre nova versão
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

      // Assume controle imediatamente das abas abertas
      await self.clients.claim();

      // Notifica todas as abas controladas de que há uma nova versão ativa
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: 'NEW_VERSION_AVAILABLE' });
      }
    })()
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests (always go to network)
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});

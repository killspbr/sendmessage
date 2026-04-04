const CACHE_NAME = 'cl-marketing-v3';
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

      // Habilita navigation preload se suportado
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

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
    (async () => {
      // 1. Tenta usar a preloadResponse se disponível
      try {
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          return preloadResponse;
        }
      } catch (e) {
        // Ignora erros de preload
      }

      // 2. Se for navegação, tenta rede primeiro
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // 3. Se rede falhar, busca no cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        throw error;
      }
    })()
  );
});

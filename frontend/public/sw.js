const CACHE_NAME = 'mensflow-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/track.png',
  '/images/apple.png',
  '/images/heart.png',
  '/images/cramps.jpg',
  '/images/fatique.jpg',
  '/images/cravings.png',
  '/images/calm.jpg',
  '/images/happy.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  // Navigation requests: network-first so the latest index.html (with new
  // bundle hashes) is always served. Falls back to cached shell offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // All other GET requests (JS, CSS, images): stale-while-revalidate.
  // Serve the cached version immediately, update the cache in the background.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetched = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetched;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  let data = { title: 'MensFlow Update', body: 'You have a cycle health update!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'MensFlow Update', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/images/track.png',
    badge: '/images/track.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      const urlToOpen = event.notification.data?.url || '/';
      for (const client of clientList) {
        const urlObj = new URL(client.url);
        const targetObj = new URL(urlToOpen, self.location.origin);
        if (urlObj.pathname === targetObj.pathname && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

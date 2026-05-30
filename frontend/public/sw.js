self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler just to satisfy PWA requirements
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response("You are currently offline.");
    })
  );
});

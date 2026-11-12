const CACHE_NAME = 'adkoul-cache-v1';
const urlsToCache = [
  './index.html',
  './vehicule.html',
  './ordre-mission.html',
  './logo.png'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Interception des requêtes (utilise le cache si hors ligne)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Retourne la version en cache
        }
        return fetch(event.request); // Sinon, va sur internet
      })
  );
});

// Mise à jour du cache
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

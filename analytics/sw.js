// Service Worker for Analytics App - Offline Support
const VERSION = '20260411-232edc2';
const CACHE_NAME = `analytics-v${VERSION}`;

const urlsToCache = [
  '/analytics/',
  '/analytics/index.html',
  '/analytics/css/main.css',
  '/analytics/js/analytics.js',
  '/analytics/js/app.js',
  '/analytics/js/db-reader.js',
  '/analytics/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('[Analytics SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Analytics SW] Caching app resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Analytics SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('analytics-v') && cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('[Analytics SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache-first strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // Don't cache non-GET requests or non-successful responses
          if (event.request.method !== 'GET' || !response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          // Offline fallback - return cached index for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/analytics/index.html')
              .then(cached => cached || caches.match('/analytics/'));
          }
          // For other requests, return a network error
          return Promise.reject('offline');
        });
      })
  );
});

// Service Worker for DB Inspector - Offline Support
const VERSION = '20260411-b6bc23a';
const CACHE_NAME = `db-inspector-v${VERSION}`;

// Base URLs without cache busting
const baseUrls = [
  '/db-inspector.html',
  '/db-inspector-manifest.json'
];

// Add cache busting query parameter to all URLs
const urlsToCache = baseUrls.map(url => {
  // Don't add query params to HTML files (causes issues)
  if (url.endsWith('.html')) {
    return url;
  }
  return `${url}?v=${VERSION}`;
});

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('[DB Inspector SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[DB Inspector SW] Caching app resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[DB Inspector SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('db-inspector-v') && cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('[DB Inspector SW] Deleting old cache:', cacheName);
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
          if (event.request.method !== 'GET' || !response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          // Offline fallback - return cached HTML for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/db-inspector.html');
          }
          // For other requests, return a network error
          return Promise.reject('offline');
        });
      })
  );
});

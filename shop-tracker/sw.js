// Service Worker for Offline Support
// Update this version with each deployment (use timestamp or commit hash)
const VERSION = '20260411-232edc2'; // Format: YYYYMMDD-shortcommit or timestamp
const CACHE_NAME = `shop-tracker-v${VERSION}`;

// Base URLs without cache busting
const baseUrls = [
  '/shop-tracker/',
  '/shop-tracker/index.html',
  '/shop-tracker/css/main.css',
  '/shop-tracker/css/tabs.css',
  '/shop-tracker/css/calculator.css',
  '/shop-tracker/css/review.css',
  '/shop-tracker/css/responsive.css',
  '/shop-tracker/js/db.js',
  '/shop-tracker/js/audio.js',
  '/shop-tracker/js/session.js',
  '/shop-tracker/js/tabs.js',
  '/shop-tracker/js/calculator.js',
  '/shop-tracker/js/cart.js',
  '/shop-tracker/js/review.js',
  '/shop-tracker/js/ui.js',
  '/shop-tracker/js/app.js',
  '/shop-tracker/manifest.json'
];

// Add cache busting query parameter to all URLs
const urlsToCache = baseUrls.map(url => {
  // Don't add query params to root or index (causes issues)
  if (url.endsWith('/') || url.endsWith('index.html')) {
    return url;
  }
  return `${url}?v=${VERSION}`;
});

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          // Offline fallback - return cached index for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/shop-tracker/index.html')
              .then(cached => cached || caches.match('/shop-tracker/'));
          }
          // For other requests, return a network error
          return Promise.reject('offline');
        });
      })
  );
});

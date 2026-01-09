/**
 * Service Worker for PWA
 * 
 * Enables offline support and caching
 */

const CACHE_NAME = 'communify-v1'
const urlsToCache = [
  '/',
  '/directory',
  '/highlights',
  '/events',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
})

self.addEventListener('fetch', (event) => {
  // Skip service worker for development - just pass through
  if (event.request.url.includes('localhost') || event.request.url.includes('127.0.0.1')) {
    event.respondWith(fetch(event.request).catch(() => {
      // If fetch fails, try cache, otherwise return empty response
      return caches.match(event.request).then(response => {
        return response || new Response('', { status: 404 });
      });
    }));
  } else {
    // Production: use cache first strategy
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).catch(() => {
          return new Response('', { status: 404 });
        });
      })
    );
  }
})


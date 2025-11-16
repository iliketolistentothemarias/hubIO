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
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})


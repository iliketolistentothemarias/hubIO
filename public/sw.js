/**
 * Legacy PWA stub — intentionally does NOT touch Cache Storage.
 * Clearing all caches here was breaking Next.js (_next/static CSS/JS) and causing
 * unstyled “HTML only” pages until a hard refresh.
 */
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

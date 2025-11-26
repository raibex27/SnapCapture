const CACHE_NAME = 'snapcapture-v5';
// These are the essential files the browser actually requests.
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // This is the main JavaScript module
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/screenshot-mobile-capture.png',
  '/screenshot-mobile-result.png',
  '/screenshot-desktop-result.png',
  // CDN URLs
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js',
  // Importmap URLs
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/@google/genai@^1.29.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching essential files');
        return cache.addAll(urlsToCache);
      }).catch(error => {
        console.error('Failed to cache files during install:', error);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response from cache
        if (response) {
          return response;
        }
        // Not in cache - fetch from the network
        return fetch(event.request);
      }
    )
  );
});

// Clean up old caches
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
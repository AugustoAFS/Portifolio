// Service Worker para PWA e Cache
const CACHE_NAME = 'afs-portfolio-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/header.css',
  '/css/hero.css',
  '/css/about.css',
  '/css/experience.css',
  '/css/projects.css',
  '/css/contact.css',
  '/css/footer.css',
  '/js/main.js',
  '/js/contact.js',
  '/js/canvas.js',
  '/SEO/manifest.json'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch with Cache Strategy (Network First, falling back to Cache)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone response because it can only be used once
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});

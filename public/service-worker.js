
const CACHE_NAME = 'triage-system-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  // Skip Supabase API requests to ensure live data
  if (event.request.url.includes('supabase.co')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Update a service worker
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

// Periodically sync data in the background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-learning-data') {
    event.waitUntil(syncLearningData());
  }
});

// Background sync function
async function syncLearningData() {
  try {
    // This would typically make API calls to refresh data
    console.log('Background sync: Refreshing learning data');
    // In a real implementation, we would call our API endpoints here
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

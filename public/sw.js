
// Cache version identifier - change this when files are updated
const CACHE_NAME = 'triagenius-v1';

// Add list of files to cache for offline access
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// App Shell - critical resources
const APP_SHELL = [
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  self.skipWaiting(); // Force activation on install
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll([...STATIC_ASSETS, ...APP_SHELL]);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => {
      console.log('Service Worker: Now ready to handle fetches!');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event handler using stale-while-revalidate strategy
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Handle the fetch with a stale-while-revalidate approach
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Return cached response if available
      if (cachedResponse) {
        // Update cache in the background
        fetch(event.request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response);
            });
          }
        }).catch(err => console.error('Background fetch failed:', err));
        
        return cachedResponse;
      }
      
      // If not in cache, fetch from network
      return fetch(event.request).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200) {
          return response;
        }
        
        // Clone the response so we can cache it
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(error => {
        console.error('Fetch failed:', error);
        // Provide a fallback for navigations
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        
        // Return an error response for other requests
        return new Response('Network error happened', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});

// Basic push notification support
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Notification', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Focus if already open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open if not already open
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

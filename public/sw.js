
// Cache version identifier - change this when files are updated
const CACHE_NAME = 'triage-system-v1';

// Add list of files to cache for offline access
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// App Shell - critical resources for the app to function
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

// Fetch event handler using network-first strategy for dynamic content
// and cache-first for static assets
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // For navigation requests (HTML pages), use network-first approach
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache a copy of the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            // If not in cache, serve the offline page
            return caches.match('/');
          });
        })
    );
    return;
  }
  
  // For static assets, use cache-first approach
  const isStaticAsset = STATIC_ASSETS.some(asset => 
    event.request.url.endsWith(asset) || 
    asset.includes(new URL(event.request.url).pathname)
  );
  
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(networkResponse => {
          // Cache the network response for future
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }
  
  // For all other requests, use network-first strategy
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache a copy of the response
        if (response.ok && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request);
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification from The Triage System',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'The Triage System', options)
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
      // Check if there's already an open window
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open a new window if needed
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || '/');
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-focus-session') {
    event.waitUntil(syncFocusSession());
  }
});

// Function to sync offline focus session data
async function syncFocusSession() {
  try {
    const offlineData = await getOfflineData('focus-sessions');
    if (offlineData && offlineData.length > 0) {
      // Process each offline session
      for (const session of offlineData) {
        await submitSession(session);
      }
      // Clear synced data
      await clearOfflineData('focus-sessions');
    }
  } catch (error) {
    console.error('Failed to sync focus sessions:', error);
    throw error; // Rethrow to trigger retry
  }
}

// Helper functions for offline data handling
async function getOfflineData(storeName) {
  // Implementation would use IndexedDB
  // Placeholder implementation
  return [];
}

async function clearOfflineData(storeName) {
  // Implementation would use IndexedDB
  // Placeholder implementation
}

async function submitSession(session) {
  // Implementation would send data to server
  // Placeholder implementation
  return true;
}

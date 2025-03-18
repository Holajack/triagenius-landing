
// Cache version identifier - change this when files are updated
const CACHE_NAME = 'triage-system-v2';
const APP_NAME = 'The Triage System';

// Add list of files to cache for offline access
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/lovable-uploads/95f9c287-86ca-4428-bbc4-b9c9b75478b9.png'
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

// Optimized fetch event handler
self.addEventListener('fetch', event => {
  // Skip cross-origin requests and non-GET requests
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests (HTML pages), use network-first approach
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache a copy of the response
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
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
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(error => {
          console.error('Fetch failed for static asset:', error);
          // Return a default response if both cache and network fail
          return new Response('Network error occurred', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
    );
    return;
  }
  
  // For all other requests, use network-first strategy with fast timeout
  event.respondWith(
    Promise.race([
      fetch(event.request).then(response => {
        // Cache a copy of the response
        if (response.ok && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }),
      // Timeout after 3s - fall back to cache
      new Promise(resolve => {
        setTimeout(() => {
          caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) resolve(cachedResponse);
          });
        }, 3000);
      })
    ]).catch(() => {
      // If race fails, try to serve from cache as last resort
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
      self.registration.showNotification(data.title || APP_NAME, options)
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
        if ('focus' in client) {
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
    event.waitUntil(syncFocusSession().catch(error => {
      console.error('Sync failed:', error);
    }));
  }
});

// Function to sync offline focus session data with improved error handling
async function syncFocusSession() {
  try {
    const offlineData = await getOfflineData('focus-sessions');
    if (offlineData && offlineData.length > 0) {
      // Process each offline session with timeout protection
      const results = await Promise.allSettled(
        offlineData.map(session => 
          Promise.race([
            submitSession(session),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ])
        )
      );
      
      // Only clear data that was successfully synced
      const successfulSyncs = results
        .filter(result => result.status === 'fulfilled')
        .map((_, index) => offlineData[index]);
      
      if (successfulSyncs.length > 0) {
        await clearSuccessfulSyncs('focus-sessions', successfulSyncs);
      }
    }
  } catch (error) {
    console.error('Failed to sync focus sessions:', error);
    // Don't rethrow to prevent infinite retries that could drain battery
  }
}

// Helper functions for offline data handling
async function getOfflineData(storeName) {
  // Implementation would use IndexedDB
  // Placeholder implementation
  return JSON.parse(localStorage.getItem(storeName) || '[]');
}

async function clearSuccessfulSyncs(storeName, successfulItems) {
  // Implementation would use IndexedDB
  // Placeholder implementation
  try {
    const currentData = JSON.parse(localStorage.getItem(storeName) || '[]');
    const remainingData = currentData.filter(item => 
      !successfulItems.some(syncedItem => syncedItem.id === item.id)
    );
    localStorage.setItem(storeName, JSON.stringify(remainingData));
  } catch (error) {
    console.error('Error clearing synced data:', error);
  }
}

async function submitSession(session) {
  // Implementation would send data to server
  // Placeholder implementation
  return new Promise(resolve => setTimeout(resolve, 100));
}

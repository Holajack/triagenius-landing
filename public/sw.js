
// Cache version identifier - change this when files are updated
const CACHE_NAME = 'triage-app-v1';

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
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll([...STATIC_ASSETS, ...APP_SHELL]);
      })
      .then(() => self.skipWaiting()) // Force activation
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
        })
      );
    }).then(() => {
      console.log('Service Worker: Now ready to handle fetches!');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Network first then cache strategy for API requests
const networkThenCache = async (request) => {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache the response for future
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    return cachedResponse || Promise.reject('No cached data available');
  }
};

// Cache first then network strategy for static assets
const cacheFirstThenNetwork = async (request) => {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response for future
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Offline fallback
    if (request.destination === 'image') {
      return caches.match('/placeholder.svg');
    }
    
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // API requests - use network first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkThenCache(request));
    return;
  }
  
  // HTML pages - use network first for fresh content
  if (request.mode === 'navigate') {
    event.respondWith(networkThenCache(request));
    return;
  }
  
  // For static assets - use cache first strategy
  event.respondWith(cacheFirstThenNetwork(request));
});

// Handle background sync for offline operations
self.addEventListener('sync', event => {
  if (event.tag === 'sync-focus-sessions') {
    event.waitUntil(syncFocusSessions());
  }
});

// Sync function to send cached focus sessions to server
async function syncFocusSessions() {
  try {
    const db = await openIndexedDB();
    const offlineSessions = await getAllOfflineSessions(db);
    
    for (const session of offlineSessions) {
      try {
        // Try to submit each session
        const response = await fetch('/api/focus-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(session)
        });
        
        if (response.ok) {
          // If successful, remove from offline storage
          await removeOfflineSession(db, session.id);
        }
      } catch (err) {
        console.error('Failed to sync session:', err);
      }
    }
  } catch (err) {
    console.error('Sync operation failed:', err);
  }
}

// IndexedDB helpers (simplified)
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('triageApp', 1);
    request.onerror = reject;
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('offlineSessions', { keyPath: 'id' });
    };
  });
}

function getAllOfflineSessions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineSessions'], 'readonly');
    const store = transaction.objectStore('offlineSessions');
    const request = store.getAll();
    request.onerror = reject;
    request.onsuccess = () => resolve(request.result);
  });
}

function removeOfflineSession(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineSessions'], 'readwrite');
    const store = transaction.objectStore('offlineSessions');
    const request = store.delete(id);
    request.onerror = reject;
    request.onsuccess = resolve;
  });
}

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there is already a window open
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no open window, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

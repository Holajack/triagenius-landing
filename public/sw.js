
// The Triage System - Service Worker
// Using Workbox for better cache management

const CACHE_NAME = 'triage-system-v6';
const offlineFallbackPage = "offline.html";

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

// Variables to track background timer (preserving from original implementation)
let backgroundTimer = {
  endTime: null,
  duration: 0,
  isRunning: false
};

self.addEventListener("message", (event) => {
  if (!event.data) return;
  
  // Handle skip waiting message
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  // Handle version check requests
  if (event.data.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        version: CACHE_NAME
      });
    }
  }
  
  // Handle background timer messages
  if (event.data.type === 'START_BACKGROUND_TIMER') {
    const { duration, timestamp } = event.data.data;
    startBackgroundTimer(duration, timestamp);
  }
  
  if (event.data.type === 'GET_BACKGROUND_TIMER') {
    if (!backgroundTimer.isRunning) return;
    
    const now = Date.now();
    const remainingTime = Math.max(0, Math.floor((backgroundTimer.endTime - now) / 1000));
    
    event.source.postMessage({
      type: 'BACKGROUND_TIMER_UPDATE',
      remainingTime
    });
    
    backgroundTimer.isRunning = false;
  }
  
  if (event.data.type === 'STOP_BACKGROUND_TIMER') {
    backgroundTimer.isRunning = false;
  }
});

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.add(offlineFallbackPage);
      })
  );
});

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
    }).then(() => {
      // Notify clients about the update
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: CACHE_NAME
          });
        });
      });
      
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Enable navigation preload if supported
if (workbox.navigationPreload && workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Default page caching strategy
workbox.routing.registerRoute(
  ({request}) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: CACHE_NAME,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache CSS, JS, and Web Worker requests with a Stale-While-Revalidate strategy
workbox.routing.registerRoute(
  ({request}) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: `${CACHE_NAME}-assets`,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache images with a Cache-First strategy
workbox.routing.registerRoute(
  ({request}) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: `${CACHE_NAME}-images`,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Skip Supabase API requests to ensure live data
workbox.routing.registerRoute(
  ({url}) => url.href.includes('supabase.co'),
  new workbox.strategies.NetworkOnly()
);

// Handle offline fallbacks
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // First, try to use the navigation preload response if it's supported
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          return preloadResponse;
        }

        const networkResponse = await fetch(event.request);
        return networkResponse;
      } catch (error) {
        // If both the preload response and fetch fail, show the offline page
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(offlineFallbackPage);
        return cachedResponse;
      }
    })());
  }
});

// Handle sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-focus-session') {
    event.waitUntil(syncFocusSession());
  }
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

// Background timer functions
function startBackgroundTimer(duration, timestamp) {
  if (!duration) return;
  
  backgroundTimer.duration = duration;
  backgroundTimer.endTime = timestamp + (duration * 1000);
  backgroundTimer.isRunning = true;
  
  console.log('Background timer started:', {
    duration,
    endTime: new Date(backgroundTimer.endTime).toISOString()
  });
  
  // Set up periodic checks while the app is in the background
  checkBackgroundTimer();
}

function checkBackgroundTimer() {
  if (!backgroundTimer.isRunning) return;
  
  const now = Date.now();
  const remainingTime = Math.max(0, Math.floor((backgroundTimer.endTime - now) / 1000));
  
  // If timer completed, send notification
  if (remainingTime === 0) {
    backgroundTimer.isRunning = false;
    
    // Show notification if supported
    if (self.registration.showNotification) {
      self.registration.showNotification('Focus Session Complete', {
        body: 'Your focus session has finished.',
        icon: '/favicon.ico',
        vibrate: [200, 100, 200]
      });
    }
    
    // Notify all clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'BACKGROUND_TIMER_COMPLETE'
        });
      });
    });
    
    return;
  }
  
  // Schedule next check
  setTimeout(checkBackgroundTimer, 1000);
}

// Simplified focus session sync function
async function syncFocusSession() {
  try {
    console.log('Background sync: Processing focus session data');
    // In a real implementation, we would synchronize data with the server
    return true;
  } catch (error) {
    console.error('Failed to sync focus sessions:', error);
    return false;
  }
}

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if there's already an open window and focus it
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      
      // If no open window, open a new one
      if (clients.openWindow) {
        const url = event.notification.data?.url || '/';
        return clients.openWindow(url);
      }
    })
  );
});

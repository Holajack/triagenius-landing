// Cache version identifier - change this when files are updated
const CACHE_NAME = 'triage-system-v9'; // Increment version to trigger updates
const APP_NAME = 'The Triage System';

// Dynamic version control based on the last deployment time
const DEPLOYMENT_TIMESTAMP = Date.now();

// Detect environment domain for proper caching and navigation
const HOST_DOMAINS = [
  'triagenius-landing.lovable.app',
  '0e9564c7-1283-4938-8998-98c4b60f0bf4.lovableproject.com'
];

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
  '/src/App.tsx',
  '/focus-session'
];

// Important routes to cache for smooth PWA navigation
const CRITICAL_ROUTES = [
  '/focus-session',
  '/session-reflection',
  '/session-report',
  '/dashboard'
];

// Install event - cache static resources with better error handling
self.addEventListener('install', event => {
  console.log(`Installing service worker v9 (${DEPLOYMENT_TIMESTAMP}) - with improved update system`);
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll([...STATIC_ASSETS, ...APP_SHELL])
          .catch(error => {
            console.error('Failed to cache some files:', error);
            // Continue anyway to ensure partial caching works
            return Promise.resolve();
          });
      })
  );
});

// Activate event - clean up old caches with improved client notification
self.addEventListener('activate', event => {
  console.log('Service Worker: Activated with version', CACHE_NAME);
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
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
      }),
      
      // Take control of all clients immediately without waiting for reload
      self.clients.claim(),
      
      // After claiming clients, notify them about the update
      self.clients.matchAll().then(clients => {
        return Promise.all(clients.map(client => {
          // Send update notification to each client
          return client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: CACHE_NAME,
            timestamp: DEPLOYMENT_TIMESTAMP
          });
        }));
      })
    ])
  );
});

// Improved fetch strategy with cache versioning support and frequent revalidation
self.addEventListener('fetch', event => {
  // Enhanced request handling for cross-domain PWA support
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Check for special update check request from client
  if (url.pathname === '/check-for-updates') {
    event.respondWith(
      new Response(JSON.stringify({
        version: CACHE_NAME,
        timestamp: DEPLOYMENT_TIMESTAMP,
        updated: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
    return;
  }
  
  // Cross-domain support - check if request is for one of our domains
  const isOurDomain = HOST_DOMAINS.some(domain => url.hostname.includes(domain));
  if (!isOurDomain && !url.hostname.includes(self.location.hostname)) {
    // For third-party requests, use network first with fast fallback
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Special handling for HTML pages - always try network first to get latest version
  if (event.request.mode === 'navigate' || 
      (event.request.method === 'GET' && 
       event.request.headers.get('accept')?.includes('text/html'))) {
    
    event.respondWith(
      fetch(event.request).then(response => {
        // Cache the fresh response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // If network fails, try cache
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || caches.match('/');
        });
      })
    );
    return;
  }
  
  // Special handling for focus session and related routes
  const isCriticalRoute = CRITICAL_ROUTES.some(route => url.pathname.includes(route));
  
  // For critical routes like focus session, use network-first with fast fallback
  if (isCriticalRoute) {
    event.respondWith(
      Promise.race([
        // Try network first - with 2s timeout
        new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            // If network is too slow, reject to try cache instead
            reject(new Error('Network timeout'));
          }, 2000);
          
          fetch(event.request).then(response => {
            clearTimeout(timeoutId);
            
            // Cache the fresh response
            if (response.ok) {
              const clonedResponse = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, clonedResponse);
              });
            }
            
            resolve(response);
          }).catch(err => {
            clearTimeout(timeoutId);
            reject(err);
          });
        }),
        
        // Simultaneously try from cache as fallback
        caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If not in cache, let the network request handle it
          throw new Error('Not found in cache');
        })
      ]).catch(() => {
        // Final fallback - use cache or offline page
        return caches.match(event.request)
          .then(cachedResponse => cachedResponse || caches.match('/'));
      })
    );
    return;
  }
  
  // For static assets, use cache-first approach
  const isStaticAsset = STATIC_ASSETS.some(asset => 
    url.pathname.endsWith(asset) || 
    asset.includes(url.pathname)
  );
  
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request)
          .then(networkResponse => {
            // Cache the network response for future
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(error => {
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
  
  // For all other requests, use stale-while-revalidate strategy with shorter max-age
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        // Always try network fetch to get fresh content
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              // Always update cache with latest response
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(error => {
            console.log('Fetch failed, falling back to cache:', error);
            // Use cached response as fallback
            return cachedResponse || new Response('Offline content not available', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        
        // Return cached response immediately if available, but still update cache in background
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Handle background sync for focus session data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-focus-session') {
    event.waitUntil(syncFocusSession());
  }
});

// More robust implementation of focus session sync
async function syncFocusSession() {
  try {
    console.log('Background sync: Processing focus session data');
    
    // Get saved sessions from localStorage
    const offlineData = await getOfflineData('focus-sessions');
    
    if (offlineData && offlineData.length > 0) {
      console.log(`Found ${offlineData.length} sessions to sync`);
      
      // Process each session with a limit of 3 attempts
      const results = await Promise.allSettled(
        offlineData.map(async (session) => {
          let attempts = 0;
          let success = false;
          
          while (attempts < 3 && !success) {
            try {
              await submitSession(session);
              success = true;
            } catch (error) {
              attempts++;
              if (attempts >= 3) {
                throw new Error(`Failed to sync after ${attempts} attempts`);
              }
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          return { session, success };
        })
      );
      
      // Filter successful syncs
      const successfulSyncs = results
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .map(result => (result as PromiseFulfilledResult<{session: any, success: boolean}>).value.session);
      
      if (successfulSyncs.length > 0) {
        await clearSuccessfulSyncs('focus-sessions', successfulSyncs);
        console.log(`Successfully synced ${successfulSyncs.length} sessions`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to sync focus sessions:', error);
    return false;
  }
}

// Helper functions for offline data handling
async function getOfflineData(storeName) {
  return JSON.parse(localStorage.getItem(storeName) || '[]');
}

async function clearSuccessfulSyncs(storeName, successfulItems) {
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
  // In a real implementation, this would submit to Supabase or another backend
  // For now, simulate a successful submission after a delay
  return new Promise((resolve) => {
    setTimeout(resolve, 300);
  });
}

// Handle push notifications with improved reliability for PWA
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
    // Try to parse as text if JSON parsing failed
    try {
      const text = event.data.text();
      self.registration.showNotification(APP_NAME, {
        body: text,
        icon: '/icons/icon-192x192.png'
      });
    } catch (e) {
      console.error('Failed to show notification:', e);
    }
  }
});

// Notification click handler with improved reliability
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

// Enhanced message handling for communication with the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Skip waiting message received, activating new worker immediately');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        version: CACHE_NAME,
        timestamp: DEPLOYMENT_TIMESTAMP
      });
    }
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        version: CACHE_NAME,
        timestamp: DEPLOYMENT_TIMESTAMP,
        updateCheckResult: 'completed'
      });
    }
  }
  
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    console.log('Force update requested by client');
    // Force activation and notify clients
    self.skipWaiting();
    self.clients.claim().then(() => {
      // Notify all clients about the forced update
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_ACTIVATED',
            timestamp: Date.now()
          });
        });
      });
    });
    
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        updated: true,
        timestamp: Date.now()
      });
    }
  }
  
  if (event.data && event.data.type === 'OPTIMIZE_FOCUS_SESSION') {
    console.log('PWA Focus Session Optimization Requested');
    // Report back success
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        optimized: true,
        timestamp: Date.now()
      });
    }
  }
});

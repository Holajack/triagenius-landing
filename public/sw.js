// Cache version identifier - change this when files are updated
const CACHE_NAME = 'lux-aquinmata-v2';

// Add list of files to cache for offline access
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/298f5dd5-723c-4333-9008-33d6b981ccfb.png',
  '/favicon.ico'
];

// Create a cache of dynamic assets - CSS, JS, etc.
// This will be populated as the user navigates the app
const DYNAMIC_CACHE = 'lux-aquinmata-dynamic-v2';

// List of routes that should serve the index.html file (for SPA navigation)
const APP_ROUTES = [
  '/',
  '/dashboard',
  '/focus-session',
  '/reports',
  '/profile',
  '/settings',
  '/community',
  '/study-room',
  '/auth',
  '/login',
  '/register',
  '/onboarding'
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing');
  self.skipWaiting(); // Force activation on install
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => {
          return new Request(url, { cache: 'no-cache', mode: 'no-cors' });
        }));
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating');
  const cacheWhitelist = [CACHE_NAME, DYNAMIC_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => {
      console.log('[Service Worker] Now ready to handle fetches!');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Helper function to determine if a request is for an API or external resource
const isApiRequest = (url) => {
  return url.pathname.startsWith('/api/') || 
         !url.origin.includes(self.location.origin);
};

// Helper function to determine if a request is for an HTML page
const isHtmlRequest = (request) => {
  return request.headers.get('accept')?.includes('text/html');
};

// Helper function to determine if a URL is an SPA route that should serve index.html
const isSpaRoute = (url) => {
  const pathname = url.pathname;
  
  // Check if the pathname exactly matches one of our app routes
  if (APP_ROUTES.includes(pathname)) {
    return true;
  }
  
  // Check if the pathname starts with any of our app routes (to handle nested routes)
  return APP_ROUTES.some(route => 
    route !== '/' && pathname.startsWith(route + '/')
  );
};

// Fetch event handler using network-first strategy for API/dynamic content
// and cache-first strategy for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip URLs that are not GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip URLs with no-cache parameter
  if (url.searchParams.has('no-cache')) return;
  
  // Skip cross-origin requests for third-party scripts and stylesheets
  if (!url.origin.includes(self.location.origin) && 
      !url.pathname.endsWith('.js') && 
      !url.pathname.endsWith('.css') && 
      !url.pathname.endsWith('.png') && 
      !url.pathname.endsWith('.jpg') && 
      !url.pathname.endsWith('.svg')) return;
  
  // Special handling for all SPA routes - always serve index.html
  // This ensures that the PWA can navigate to any route correctly
  if (isSpaRoute(url) || isHtmlRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }
  
  // Optimization: For API requests or external resources, prefer network
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network request fails, try serving from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For all other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached response
          // Update cache in the background for next time
          fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                // Only cache valid responses
                const responseToCache = response.clone();
                caches.open(DYNAMIC_CACHE).then(cache => {
                  // Add immutable caching for static assets
                  const headers = new Headers(response.headers);
                  headers.append('Cache-Control', 'immutable');
                  
                  const responseWithHeaders = new Response(responseToCache.body, {
                    status: responseToCache.status,
                    statusText: responseToCache.statusText,
                    headers: headers
                  });
                  
                  cache.put(event.request, responseWithHeaders);
                });
              }
            })
            .catch(err => console.error('Background fetch failed:', err));
          
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache the fetched response
            caches.open(DYNAMIC_CACHE).then(cache => {
              // Add Cache-Control header for static assets
              if (event.request.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/i)) {
                const headers = new Headers(responseToCache.headers);
                headers.append('Cache-Control', 'immutable');
                
                const responseWithHeaders = new Response(responseToCache.body, {
                  status: responseToCache.status,
                  statusText: responseToCache.statusText,
                  headers: headers
                });
                
                cache.put(event.request, responseWithHeaders);
              } else {
                cache.put(event.request, responseToCache);
              }
            });
            
            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            
            // Provide a fallback for image requests
            if (event.request.url.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
              return caches.match('/placeholder.svg');
            }
            
            // For navigation, return the offline page
            if (isHtmlRequest(event.request)) {
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
      icon: '/lovable-uploads/298f5dd5-723c-4333-9008-33d6b981ccfb.png',
      badge: '/lovable-uploads/298f5dd5-723c-4333-9008-33d6b981ccfb.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
        url: data.url || '/'
      },
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/lovable-uploads/298f5dd5-723c-4333-9008-33d6b981ccfb.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Lux Aquinmata Notification', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Navigate user to a specific URL if provided in the notification data
  const url = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Focus if already open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open if not already open
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Add support for App Banner events
self.addEventListener('appinstalled', (event) => {
  console.log('App was installed', event);
});

// Periodic background sync for new content (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-content') {
      event.waitUntil(
        // Fetch new content and update cache
        fetch('/api/latest-content')
          .then(response => response.json())
          .then(data => {
            // Update caches with new content
            console.log('Background sync: updating content');
          })
          .catch(err => {
            console.error('Background sync failed:', err);
          })
      );
    }
  });
}


const CACHE_NAME = 'triage-system-v6';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
];

// Variables to track background timer
let backgroundTimer = {
  endTime: null,
  duration: 0,
  isRunning: false
};

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

// Function to start background timer
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

// Function to check background timer state
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

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME
    });
  }
  
  // Handle update check requests
  if (event.data.type === 'CHECK_UPDATE') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        version: CACHE_NAME,
        timestamp: Date.now()
      });
    }
  }
  
  // Handle timer control messages
  if (event.data.type === 'START_BACKGROUND_TIMER') {
    const { duration, timestamp } = event.data.data;
    startBackgroundTimer(duration, timestamp);
  }
  
  // Get current background timer state
  if (event.data.type === 'GET_BACKGROUND_TIMER') {
    if (!backgroundTimer.isRunning) return;
    
    const now = Date.now();
    const remainingTime = Math.max(0, Math.floor((backgroundTimer.endTime - now) / 1000));
    
    // Send current timer state to client
    event.source.postMessage({
      type: 'BACKGROUND_TIMER_UPDATE',
      remainingTime
    });
    
    // Stop background timer if app is visible again
    backgroundTimer.isRunning = false;
  }
  
  // Stop background timer
  if (event.data.type === 'STOP_BACKGROUND_TIMER') {
    backgroundTimer.isRunning = false;
  }
});

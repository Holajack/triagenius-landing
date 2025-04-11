// Cache version identifier - change this when files are updated
const CACHE_NAME = 'triage-system-v12'; // Incremented version
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
  console.log(`Installing service worker v12 (${DEPLOYMENT_TIMESTAMP}) - with background timer support`);
  
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

// Variables to track background timers
const backgroundTimers = new Map();

// Track sent notifications to prevent duplicates
const sentNotifications = new Map();
const NOTIFICATION_COOLDOWN = 60000; // 1 minute cooldown between similar notifications

// Helper function to check if a notification was recently sent
function wasNotificationRecentlySent(id, type) {
  const notificationKey = `${id}-${type}`;
  const lastSent = sentNotifications.get(notificationKey);
  const now = Date.now();
  
  if (lastSent && now - lastSent < NOTIFICATION_COOLDOWN) {
    console.log(`Skipping duplicate notification: ${notificationKey} - Last sent ${now - lastSent}ms ago`);
    return true;
  }
  
  // Record this notification
  sentNotifications.set(notificationKey, now);
  
  // Clean up old notification records (older than 2x the cooldown period)
  for (const [key, timestamp] of sentNotifications.entries()) {
    if (now - timestamp > NOTIFICATION_COOLDOWN * 2) {
      sentNotifications.delete(key);
    }
  }
  
  return false;
}

// Function to start background timer with current remaining time
function startBackgroundTimer(id, duration, startTime, options = {}, currentRemaining = null) {
  if (!duration || backgroundTimers.has(id)) return;
  
  // If current remaining time is provided, use it to adjust the start time
  let adjustedStartTime = startTime;
  if (currentRemaining !== null) {
    const elapsedSeconds = duration - currentRemaining;
    adjustedStartTime = Date.now() - (elapsedSeconds * 1000);
  }
  
  const endTime = adjustedStartTime + (duration * 1000);
  
  backgroundTimers.set(id, {
    id,
    duration,
    startTime: adjustedStartTime,
    endTime,
    isRunning: true,
    options,
    intervalId: null,
    notificationSent: false // Track if completion notification was already sent
  });
  
  console.log('Background timer started:', {
    id,
    duration,
    endTime: new Date(endTime).toISOString(),
    currentRemaining: currentRemaining
  });
  
  // Set up periodic checks while the app is in the background
  checkBackgroundTimer(id);
  
  // Store timer in IndexedDB for persistence
  storeBackgroundTimerState(id, {
    id,
    duration,
    startTime: adjustedStartTime,
    endTime,
    isRunning: true,
    options,
    notificationSent: false
  });
}

// Function to check background timer state
function checkBackgroundTimer(id) {
  const timer = backgroundTimers.get(id);
  if (!timer || !timer.isRunning) return;
  
  const now = Date.now();
  const remainingTime = Math.max(0, Math.floor((timer.endTime - now) / 1000));
  
  // If timer completed, send notification
  if (remainingTime <= 0) {
    backgroundTimers.get(id).isRunning = false;
    
    // Only show notification if it hasn't been sent and not in cooldown period
    if (!timer.notificationSent && !wasNotificationRecentlySent(id, 'timer-complete')) {
      timer.notificationSent = true;
      
      // Show notification if supported
      if (self.registration.showNotification) {
        const notificationOptions = {
          body: timer.options.notificationBody || 'Your timer has finished.',
          icon: '/lovable-uploads/95f9c287-86ca-4428-bbc4-b9c9b75478b9.png',
          badge: '/lovable-uploads/95f9c287-86ca-4428-bbc4-b9c9b75478b9.png',
          vibrate: [200, 100, 200],
          data: { 
            url: timer.options.notificationUrl || '/focus-session',
            id: id,
            timestamp: now
          },
          tag: `timer-completed-${id}` // Use tag to replace existing notifications for this timer
        };
        
        self.registration.showNotification(
          timer.options.notificationTitle || 'Timer Complete', 
          notificationOptions
        );
      }
      
      // Update timer state in storage
      storeBackgroundTimerState(id, {
        ...timer,
        notificationSent: true
      });
    }
    
    // Notify all clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'BACKGROUND_TIMER_COMPLETE',
          timerId: id,
          timestamp: Date.now()
        });
      });
    });
    
    // Remove from storage
    removeBackgroundTimerState(id);
    
    return;
  }
  
  // Notify clients about timer status every 5 seconds
  if (remainingTime % 5 === 0) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'BACKGROUND_TIMER_UPDATE',
          timerId: id,
          remainingTime: remainingTime,
          timestamp: now
        });
      });
    });
  }
  
  // Schedule next check
  backgroundTimers.get(id).intervalId = setTimeout(() => checkBackgroundTimer(id), 1000);
}

// Function to stop background timer
function stopBackgroundTimer(id) {
  const timer = backgroundTimers.get(id);
  if (!timer) return;
  
  if (timer.intervalId) {
    clearTimeout(timer.intervalId);
  }
  
  backgroundTimers.delete(id);
  removeBackgroundTimerState(id);
  
  console.log('Background timer stopped:', id);
}

// Function to pause background timer
function pauseBackgroundTimer(id) {
  const timer = backgroundTimers.get(id);
  if (!timer || !timer.isRunning) return;
  
  timer.isRunning = false;
  if (timer.intervalId) {
    clearTimeout(timer.intervalId);
    timer.intervalId = null;
  }
  
  // Calculate remaining time
  const now = Date.now();
  const remainingMs = Math.max(0, timer.endTime - now);
  timer.remainingMs = remainingMs;
  
  // Update storage
  storeBackgroundTimerState(id, {
    ...timer,
    remainingMs,
    isRunning: false
  });
  
  console.log('Background timer paused:', id, 'with remaining ms:', remainingMs);
}

// Function to resume background timer with current remaining time
function resumeBackgroundTimer(id, currentRemaining = null) {
  const timer = backgroundTimers.get(id);
  if (!timer) return;
  
  const now = Date.now();
  
  if (currentRemaining !== null) {
    // Use provided remaining time
    timer.endTime = now + (currentRemaining * 1000);
  } else {
    // Use stored remaining time
    timer.endTime = now + (timer.remainingMs || (timer.duration * 1000));
  }
  
  timer.isRunning = true;
  
  // Update storage
  storeBackgroundTimerState(id, {
    ...timer,
    startTime: now,
    endTime: timer.endTime,
    isRunning: true
  });
  
  checkBackgroundTimer(id);
  console.log('Background timer resumed:', id);
}

// IndexedDB operations for timer persistence
let db;

function openTimerDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    
    const request = indexedDB.open('BackgroundTimersDB', 1);
    
    request.onerror = event => {
      console.error('IndexedDB error:', event.target.error);
      reject('Could not open timer database');
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('timers')) {
        db.createObjectStore('timers', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = event => {
      db = event.target.result;
      resolve(db);
    };
  });
}

function storeBackgroundTimerState(id, timerData) {
  openTimerDB().then(db => {
    const transaction = db.transaction(['timers'], 'readwrite');
    const store = transaction.objectStore('timers');
    store.put(timerData);
  }).catch(error => console.error('Error storing timer state:', error));
}

function removeBackgroundTimerState(id) {
  openTimerDB().then(db => {
    const transaction = db.transaction(['timers'], 'readwrite');
    const store = transaction.objectStore('timers');
    store.delete(id);
  }).catch(error => console.error('Error removing timer state:', error));
}

function loadBackgroundTimers() {
  openTimerDB().then(db => {
    const transaction = db.transaction(['timers'], 'readonly');
    const store = transaction.objectStore('timers');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const timers = request.result;
      console.log('Loaded background timers:', timers.length);
      
      timers.forEach(timer => {
        // Only restore running timers
        if (timer.isRunning) {
          // Check if timer is still valid
          const now = Date.now();
          if (timer.endTime > now) {
            startBackgroundTimer(
              timer.id,
              timer.duration,
              timer.startTime,
              timer.options
            );
          } else {
            // Timer already expired, clean up
            removeBackgroundTimerState(timer.id);
          }
        }
      });
    };
  }).catch(error => console.error('Error loading timers:', error));
}

// Load saved timers when service worker starts
loadBackgroundTimers();

// Enhanced message handling for timers
self.addEventListener('message', event => {
  if (!event.data) return;
  
  // Handle timer control messages
  if (event.data.type === 'START_BACKGROUND_TIMER') {
    const { id, duration, startTime, options, currentRemaining } = event.data;
    startBackgroundTimer(id, duration, startTime, options, currentRemaining);
    
    // Confirm back to client
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        type: 'BACKGROUND_TIMER_STARTED',
        timerId: id,
        timestamp: Date.now()
      });
    }
  }
  
  if (event.data.type === 'STOP_BACKGROUND_TIMER') {
    const { id } = event.data;
    stopBackgroundTimer(id);
    
    // Confirm back to client
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        type: 'BACKGROUND_TIMER_STOPPED',
        timerId: id,
        timestamp: Date.now()
      });
    }
  }
  
  if (event.data.type === 'PAUSE_BACKGROUND_TIMER') {
    const { id } = event.data;
    pauseBackgroundTimer(id);
  }
  
  if (event.data.type === 'RESUME_BACKGROUND_TIMER') {
    const { id, currentRemaining } = event.data;
    resumeBackgroundTimer(id, currentRemaining);
  }
  
  if (event.data.type === 'GET_BACKGROUND_TIMER') {
    const { id } = event.data;
    const timer = backgroundTimers.get(id);
    
    if (timer && timer.isRunning) {
      const now = Date.now();
      const remainingTime = Math.max(0, Math.floor((timer.endTime - now) / 1000));
      
      // Send current timer state to client
      event.source.postMessage({
        type: 'BACKGROUND_TIMER_UPDATE',
        timerId: id,
        remainingTime,
        progress: 1 - (remainingTime / timer.duration),
        isRunning: timer.isRunning,
        timestamp: now
      });
    } else {
      // No running timer found
      event.source.postMessage({
        type: 'BACKGROUND_TIMER_NOT_FOUND',
        timerId: id
      });
    }
  }
  
  if (event.data.type === 'GET_ALL_BACKGROUND_TIMERS') {
    const timersData = Array.from(backgroundTimers.entries()).map(([id, timer]) => {
      const now = Date.now();
      const remainingTime = Math.max(0, Math.floor((timer.endTime - now) / 1000));
      
      return {
        id,
        remainingTime,
        progress: 1 - (remainingTime / timer.duration),
        isRunning: timer.isRunning,
        timestamp: now
      };
    });
    
    event.source.postMessage({
      type: 'ALL_BACKGROUND_TIMERS',
      timers: timersData
    });
  }
  
  // Clear any existing notifications for a specific timer
  if (event.data.type === 'CLEAR_TIMER_NOTIFICATIONS') {
    const { id } = event.data;
    if (self.registration.getNotifications) {
      self.registration.getNotifications({ tag: `timer-completed-${id}` })
        .then(notifications => {
          notifications.forEach(notification => notification.close());
        });
    }
  }
  
  // Handle other messages like before
  // ... keep existing code (message handling for updates and other functionality)
});

// Improved fetch strategy with user-based caching and authentication awareness
self.addEventListener('fetch', event => {
  // Enhanced request handling for cross-domain PWA support
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle special auth-aware update check request
  if (url.pathname === '/check-for-updates' || url.pathname === '/auth-check-for-updates') {
    // Extract user info from request if available
    const userId = url.searchParams.get('userId');
    const lastLogin = url.searchParams.get('lastLogin');
    
    event.respondWith(
      new Response(JSON.stringify({
        version: CACHE_NAME,
        timestamp: DEPLOYMENT_TIMESTAMP,
        updated: true,
        userInfo: userId ? { userId, lastChecked: Date.now() } : null
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
    return;
  }
  
  // Special handling for auth routes - always bypass cache
  if (url.pathname.includes('/auth') || url.pathname.includes('/token')) {
    event.respondWith(fetch(event.request));
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
  
  // For all other requests, use stale-while-revalidate strategy
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

// Handle push notifications with improved reliability for PWA
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    // Check for duplicate notifications
    const notificationId = data.id || 'generic-push';
    if (wasNotificationRecentlySent(notificationId, 'push')) {
      return; // Skip duplicate notification
    }
    
    const options = {
      body: data.body || 'New notification from The Triage System',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      tag: data.tag || `push-${notificationId}`, // Use tag for deduplication
      data: {
        url: data.url || '/',
        id: notificationId,
        timestamp: Date.now()
      },
      renotify: false // Don't vibrate/alert if replacing existing notification
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || APP_NAME, options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
    // Try to parse as text if JSON parsing failed
    try {
      const text = event.data.text();
      
      if (!wasNotificationRecentlySent('text-push', 'push')) {
        self.registration.showNotification(APP_NAME, {
          body: text,
          icon: '/icons/icon-192x192.png',
          tag: 'text-push' // Use consistent tag for text notifications
        });
      }
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

// Close duplicate notifications
self.addEventListener('notificationclose', event => {
  // Nothing to do here, but could be used for analytics
});

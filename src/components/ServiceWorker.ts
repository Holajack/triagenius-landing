
// Functions to register and manage service worker for PWA functionality

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const swUrl = `${window.location.origin}/sw.js`;
        const registration = await navigator.serviceWorker.register(swUrl);
        
        console.log('ServiceWorker registration successful with scope:', registration.scope);
        
        // Handle updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // At this point, the updated precached content has been fetched
                console.log('New content is available; please refresh.');
                
                // Show update notification to the user
                if (window.confirm('New version available! Reload to update?')) {
                  window.location.reload();
                }
              } else {
                // At this point, everything has been precached.
                console.log('Content is cached for offline use.');
              }
            }
          };
        };
        
        // Enable background sync for offline support
        if ('SyncManager' in window) {
          registerBackgroundSync(registration);
        }
        
        // Enable push notifications if supported
        if ('PushManager' in window) {
          registerPushNotifications(registration);
        }
        
      } catch (error) {
        console.error('Error during service worker registration:', error);
      }
    });
    
    // Handle controller updates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }
}

// Register background sync
async function registerBackgroundSync(registration: ServiceWorkerRegistration) {
  try {
    // Register background sync for offline focus sessions
    await registration.sync.register('sync-focus-sessions');
    console.log('Background sync registered successfully');
  } catch (error) {
    console.error('Background sync registration failed:', error);
  }
}

// Register for push notifications (user permission required)
async function registerPushNotifications(registration: ServiceWorkerRegistration) {
  try {
    // Check if we already have permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Subscribe the user to push notifications
      // This would typically send the subscription to your server
      // const subscription = await registration.pushManager.subscribe({
      //   userVisibleOnly: true,
      //   applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
      // });
      
      // console.log('Push notification subscription:', subscription);
      
      // In a real app, you would send this subscription to your server
      // await fetch('/api/push-subscriptions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subscription)
      // });
    } else {
      console.log('Notification permission denied');
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
}

// Unregister service worker
export async function unregister() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('ServiceWorker unregistered successfully');
    } catch (error) {
      console.error('Error during service worker unregistration:', error);
    }
  }
}

// Helper function to convert VAPID key for push notifications
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Detect if app is in standalone mode (installed)
export function isInStandaloneMode() {
  return (window.matchMedia('(display-mode: standalone)').matches) || 
         (window.navigator as any).standalone || 
         document.referrer.includes('android-app://');
}

// Get app install status
export function getInstallStatus() {
  return {
    isInstalled: isInStandaloneMode(),
    isInstallable: 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window
  };
}

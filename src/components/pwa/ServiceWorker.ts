
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
                console.log('New content is available; please refresh.');
                
                // Show update notification to the user
                if (window.confirm('New version available! Reload to update?')) {
                  window.location.reload();
                }
              } else {
                console.log('Content is cached for offline use.');
              }
            }
          };
        };
        
        // Enable background sync if supported - with improved error handling and standardized tag name
        if ('SyncManager' in window) {
          setTimeout(async () => {
            try {
              // Use optional chaining to safely check if sync exists
              if ('sync' in registration) {
                // Use type assertion for safety
                await (registration as any).sync?.register('sync-focus-session');
                console.log('Background sync registered');
              }
            } catch (err) {
              console.log('Background sync registration failed:', err);
            }
          }, 0); // Use setTimeout to prevent blocking main thread
        }
        
      } catch (error) {
        console.error('Error during service worker registration:', error);
      }
    });
    
    // Handle service worker updates and refresh
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

// Send notification
export function sendNotification(title: string, options: NotificationOptions = {}) {
  if (!('Notification' in window)) {
    return;
  }
  
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        ...options,
      });
      
      notification.onclick = function() {
        window.focus();
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        notification.close();
      };
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }
}

// Request camera and microphone permissions
export async function requestMediaPermissions(): Promise<{video: boolean, audio: boolean}> {
  const result = { video: false, audio: false };
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log('getUserMedia is not supported in this browser');
    return result;
  }
  
  // Check for video permission
  try {
    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    result.video = true;
    
    // Stop the tracks to release the camera
    videoStream.getTracks().forEach(track => track.stop());
  } catch (error) {
    console.error('Error requesting video permission:', error);
  }
  
  // Check for audio permission
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    result.audio = true;
    
    // Stop the tracks to release the microphone
    audioStream.getTracks().forEach(track => track.stop());
  } catch (error) {
    console.error('Error requesting audio permission:', error);
  }
  
  return result;
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

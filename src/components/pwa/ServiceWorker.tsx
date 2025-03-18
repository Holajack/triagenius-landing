
// Functions to register and manage service worker for PWA functionality

export function register() {
  if ('serviceWorker' in navigator) {
    try {
      const swUrl = `${window.location.origin}/sw.js`;
      console.log('Registering service worker at:', swUrl);
      
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
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
                  
                  // Show update notification to the user - using native confirm for better mobile experience
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
          
          // Register for background sync if browser supports it
          if ('SyncManager' in window) {
            // Use optional chaining and type checking to safely access the sync property
            (registration as any).sync?.register('sync-focus-session')
              .catch(err => console.error('Background sync registration failed:', err));
          }
        })
        .catch(error => {
          console.error('Error during service worker registration:', error);
        });
      
      // Handle controller updates
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (error) {
      console.error('Error initiating service worker registration:', error);
    }
  }
}

// Unregister service worker
export async function unregister() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('ServiceWorker unregistered successfully');
      localStorage.removeItem('isPWA'); // Clear PWA indicator
    } catch (error) {
      console.error('Error during service worker unregistration:', error);
    }
  }
}

// Check if app is installed
export function isAppInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// Save data for offline use
export function saveForOffline(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving data for offline use:', error);
    return false;
  }
}

// Get offline data
export function getOfflineData(key: string) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting offline data:', error);
    return null;
  }
}

// Request app installation
export function promptInstall() {
  return new Promise<boolean>((resolve) => {
    // Store the beforeinstallprompt event for later use
    let deferredPrompt: any;
    
    // Handler for the beforeinstallprompt event
    const promptHandler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      deferredPrompt = e;
      
      // Remove event listener as it's no longer needed
      window.removeEventListener('beforeinstallprompt', promptHandler);
      
      // Show installation prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice
        .then((choiceResult: { outcome: string }) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
            resolve(true);
          } else {
            console.log('User dismissed the install prompt');
            resolve(false);
          }
          deferredPrompt = null;
        })
        .catch((error: any) => {
          console.error('Error in installation prompt:', error);
          resolve(false);
        });
    };
    
    window.addEventListener('beforeinstallprompt', promptHandler);
    
    // Set a timeout to resolve the promise if no prompt appears
    setTimeout(() => {
      if (!deferredPrompt) {
        window.removeEventListener('beforeinstallprompt', promptHandler);
        resolve(false);
      }
    }, 3000);
  });
}

// Simple check if the browser supports PWA features
export function isPwaSupported() {
  return 'serviceWorker' in navigator;
}

// Check if running on iOS
export function isIOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform) || 
  (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

// Check if running on Android
export function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

// Detect if app is running in fullscreen mode
export function isFullscreen() {
  return window.matchMedia('(display-mode: fullscreen)').matches ||
         window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

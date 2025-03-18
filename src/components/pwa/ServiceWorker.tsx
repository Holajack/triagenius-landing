
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

// Request app installation
export async function promptInstall() {
  // Store the beforeinstallprompt event for later use
  let deferredPrompt: any;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Store the event so it can be triggered later
    deferredPrompt = e;
    
    // Show your custom "Add to Home Screen" UI element
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
      installBtn.style.display = 'block';
      
      installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        
        // We've used the prompt, and can't use it again, discard it
        deferredPrompt = null;
        
        // Hide the install button
        installBtn.style.display = 'none';
      });
    }
  });
  
  // Listen for app installed event
  window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed', evt);
    // Hide the install button if it exists
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  });
}

// Simple check if the browser supports PWA features
export function isPwaSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

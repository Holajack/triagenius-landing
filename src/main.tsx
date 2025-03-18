
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Toaster } from "./components/ui/toaster"
import { toast } from "@/hooks/use-toast"

// Create root outside of the render call
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = ReactDOM.createRoot(rootElement);

// Log when running in standalone PWA mode
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true;
if (isStandalone) {
  console.log('App running in standalone/PWA mode');
  document.documentElement.classList.add('pwa-mode');
}

// Render with React.StrictMode
root.render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);

// Set up event listener for service worker messages
const setupServiceWorkerMessaging = () => {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
      console.log('Update message from service worker:', event.data);
      
      // Show toast notification for the update
      toast({
        title: "Update Available",
        description: "A new version of The Triage System is available. Reload to update.",
        action: (
          <button 
            onClick={() => {
              // Send message to service worker to skip waiting and activate new version
              navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
              // Reload the page to apply the update
              window.location.reload();
            }}
            className="bg-[#bfaa4a] hover:bg-[#bfaa4a]/90 text-black rounded px-2 py-1 text-xs"
          >
            Update Now
          </button>
        ),
        duration: 0 // Don't auto-dismiss this important notification
      });
    }
  });
};

// Enhanced service worker registration with improved cross-browser support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Use absolute URL to ensure consistent behavior across browsers
      const swUrl = `${window.location.origin}/sw.js`;
      console.log('Registering service worker at:', swUrl);
      
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
        updateViaCache: 'none' // Ensure proper cache control
      });
      
      console.log('Service worker registered successfully:', registration.scope);
      
      // Set up event listener for communication
      setupServiceWorkerMessaging();
      
      // Handle updates with better UX for standalone mode
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('New content is available; please refresh.');
              
              // For installed PWA, show an update notification
              if (isStandalone) {
                toast({
                  title: "Update Available",
                  description: "A new version of The Triage System is available.",
                  action: (
                    <button 
                      onClick={() => {
                        // Send message to service worker to skip waiting
                        navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
                        // Reload the page to apply the update
                        window.location.reload();
                      }}
                      className="bg-[#bfaa4a] hover:bg-[#bfaa4a]/90 text-black rounded px-2 py-1 text-xs"
                    >
                      Update Now
                    </button>
                  ),
                  duration: 0 // Don't auto-dismiss this important notification
                });
              } else {
                // For browser mode, we can use a more direct approach
                if (window.confirm('New version available! Reload to update?')) {
                  window.location.reload();
                }
              }
            } else {
              console.log('Content is cached for offline use.');
              // Set flag for PWA installation
              localStorage.setItem('pwaInstallable', 'true');
            }
          }
        };
      };
      
      // Check for updates more frequently - every 15 minutes
      setInterval(() => {
        registration.update();
        console.log('Checking for service worker updates');
      }, 15 * 60 * 1000);
      
      // For Chrome on Android, specifically check if conditions are right for PWA
      const isChrome = /chrome/i.test(navigator.userAgent);
      const isAndroid = /android/i.test(navigator.userAgent);
      if (isChrome && isAndroid) {
        // Force a check for beforeinstallprompt conditions
        setTimeout(() => {
          if (registration.active) {
            console.log('Chrome on Android: Verifying PWA installability');
            // Signal to InstallPrompt that conditions are met
            localStorage.setItem('chromeAndroidInstallable', 'true');
            // Dispatch a custom event that InstallPrompt can listen for
            window.dispatchEvent(new CustomEvent('pwa-installable', {
              detail: { browser: 'Chrome', platform: 'Android' }
            }));
          }
        }, 2000);
      }
      
      // Listen for standalone mode changes (for analytics and UX adjustments)
      window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
        console.log('Display mode changed to:', e.matches ? 'standalone' : 'browser');
        if (e.matches) {
          // The app has been launched as a standalone PWA
          localStorage.setItem('runningAsStandalone', 'true');
          // Dispatch event for components to adjust their UI accordingly
          window.dispatchEvent(new CustomEvent('standalone-mode-changed', {
            detail: { isStandalone: true }
          }));
        }
      });
      
      // Check on load if we're in standalone mode
      const checkStandaloneMode = () => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true;
        
        if (isStandalone) {
          console.log('App running in standalone mode (installed as PWA)');
          localStorage.setItem('runningAsStandalone', 'true');
          // Let components know they should adjust their UI for standalone mode
          window.dispatchEvent(new CustomEvent('standalone-mode-changed', {
            detail: { isStandalone: true }
          }));
        }
      };
      
      // Check standalone mode when the page loads
      checkStandaloneMode();
      
      // Register for periodic background sync (if supported)
      if ('periodicSync' in registration) {
        try {
          await (registration as any).periodicSync.register('update-content', {
            minInterval: 12 * 60 * 60 * 1000, // 12 hours
          });
          console.log('Periodic background sync registered');
        } catch (error) {
          console.error('Error registering periodic sync:', error);
        }
      }
      
      // Log when the service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker controller changed');
      });
      
      // Enable debugging in development
      if (process.env.NODE_ENV === 'development') {
        navigator.serviceWorker.addEventListener('message', event => {
          console.log('[ServiceWorker Message]:', event.data);
        });
      }
      
      // Add specific handling for auth routes in PWA mode
      if (isStandalone) {
        // Listen for navigation events in PWA mode
        window.addEventListener('popstate', (event) => {
          // Log navigation in PWA mode for debugging
          console.log('PWA navigation:', window.location.pathname);
        });
        
        // If we're in PWA mode and on the auth page, make sure it's properly displayed
        if (window.location.pathname === '/auth' || 
            window.location.pathname === '/login' || 
            window.location.pathname === '/register') {
          console.log('PWA on auth page, ensuring proper display');
        }
      }
      
    } catch (error) {
      console.error('Error during service worker registration:', error);
    }
  });
}

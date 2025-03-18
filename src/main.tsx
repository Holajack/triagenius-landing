
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Toaster } from "./components/ui/toaster"

// Create root outside of the render call
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = ReactDOM.createRoot(rootElement);

// Render with React.StrictMode
root.render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);

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
      
      // Handle updates with better UX for standalone mode
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('New content is available; please refresh.');
              
              // Check if running in standalone mode (PWA installed)
              const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                                  (window.navigator as any).standalone === true;
              
              // Improved update UX with custom UI based on mode
              if (isStandalone) {
                // For installed PWA, use a less intrusive update notification
                // that doesn't disrupt the app-like experience
                const event = new CustomEvent('pwa-update-available');
                window.dispatchEvent(event);
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
      
      // Check for updates every 30 minutes
      setInterval(() => {
        registration.update();
        console.log('Checking for service worker updates');
      }, 30 * 60 * 1000);
      
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
      
    } catch (error) {
      console.error('Error during service worker registration:', error);
    }
  });
}

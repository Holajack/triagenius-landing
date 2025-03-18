
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Toaster } from "./components/ui/toaster"

// Register service worker for PWA functionality with improved error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = '/sw.js';
    
    // Use requestIdleCallback to avoid interfering with the initial load
    const registerSW = () => {
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('Service worker registered successfully:', registration.scope);
          
          // Handle updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;
            
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('New content is available; please refresh.');
                  
                  // Use a less intrusive notification for PWA mode
                  if (localStorage.getItem('isPWA') === 'true') {
                    const notification = document.createElement('div');
                    notification.style.position = 'fixed';
                    notification.style.bottom = '20px';
                    notification.style.right = '20px';
                    notification.style.padding = '10px 15px';
                    notification.style.backgroundColor = '#4c1d95';
                    notification.style.color = 'white';
                    notification.style.borderRadius = '5px';
                    notification.style.zIndex = '9999';
                    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                    notification.textContent = 'Update available! Tap to refresh.';
                    
                    notification.addEventListener('click', () => {
                      window.location.reload();
                    });
                    
                    document.body.appendChild(notification);
                    
                    // Auto-remove after 10 seconds
                    setTimeout(() => {
                      if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                      }
                    }, 10000);
                  } else {
                    // Show native confirm for browser mode
                    if (window.confirm('New version available! Reload to update?')) {
                      window.location.reload();
                    }
                  }
                } else {
                  console.log('Content is cached for offline use.');
                }
              }
            };
          };
          
          // Enable background sync for focus sessions - with PWA detection
          if ('SyncManager' in window && localStorage.getItem('isPWA') === 'true') {
            // Safely access the sync property with proper type handling
            setTimeout(() => {
              try {
                // Use type assertion to handle the sync property that TypeScript doesn't recognize
                const syncRegistration = registration as unknown as { sync?: { register: (tag: string) => Promise<void> } };
                if (syncRegistration.sync) {
                  syncRegistration.sync.register('sync-focus-session')
                    .catch(err => console.log('Background sync registration failed:', err));
                }
              } catch (err) {
                console.log('Error accessing sync manager:', err);
              }
            }, 1000); // Delay to ensure service worker is fully active
          }
        })
        .catch(error => {
          console.error('Error during service worker registration:', error);
        });
    };
    
    // Use requestIdleCallback if available, otherwise use setTimeout
    if ('requestIdleCallback' in window) {
      // @ts-ignore - TypeScript might not recognize requestIdleCallback
      window.requestIdleCallback(registerSW);
    } else {
      setTimeout(registerSW, 1000);
    }
      
    // Handle service worker updates and refresh - more robust implementation
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      
      // Use requestAnimationFrame for smoother transitions in PWA
      if (localStorage.getItem('isPWA') === 'true') {
        requestAnimationFrame(() => {
          window.location.reload();
        });
      } else {
        window.location.reload();
      }
    });
  });
  
  // Check if the app is being launched from the home screen
  const isInStandaloneMode = () => {
    return (window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true);
  };
  
  // Apply specific styles or behaviors for standalone mode
  if (isInStandaloneMode()) {
    document.body.classList.add('standalone-mode');
    // Store the fact that we're running as a PWA
    localStorage.setItem('isPWA', 'true');
  }
}

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

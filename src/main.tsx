
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Toaster } from "./components/ui/toaster"
import * as ServiceWorker from './components/pwa/ServiceWorker'

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
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
        
        // Enable background sync for focus sessions
        if ('SyncManager' in window) {
          // Use type assertion and optional chaining to safely access the sync property
          (registration as any).sync?.register('sync-focus-session')
            .catch(err => console.log('Background sync registration failed:', err));
        }
      })
      .catch(error => {
        console.error('Error during service worker registration:', error);
      });
      
    // Handle service worker updates and refresh
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
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

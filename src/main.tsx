
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

// Enhanced service worker registration that works across browsers
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
      
      // Handle updates with better UX
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('New content is available; please refresh.');
              
              // Improved update UX with custom UI
              if (window.confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            } else {
              console.log('Content is cached for offline use.');
            }
          }
        };
      };
      
      // Check for updates every 30 minutes
      setInterval(() => {
        registration.update();
        console.log('Checking for service worker updates');
      }, 30 * 60 * 1000);
      
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

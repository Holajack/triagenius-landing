
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

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const swUrl = `${window.location.origin}/sw.js`;
      console.log('Registering service worker at:', swUrl);
      
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
        updateViaCache: 'none'
      });
      
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

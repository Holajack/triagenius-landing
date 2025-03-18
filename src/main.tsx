
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Toaster } from "./components/ui/toaster"

// Register service worker for PWA functionality
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${window.location.origin}/sw.js`;
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
        })
        .catch(error => {
          console.error('Error during service worker registration:', error);
        });
    });
  }
};

// Call the service worker registration function
registerServiceWorker();

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

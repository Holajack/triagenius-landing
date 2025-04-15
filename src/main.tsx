
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { Toaster } from "./components/ui/toaster"
import { ThemeProvider } from '@/contexts/ThemeContext'

// Detect if the app is being launched in standalone mode with multi-domain support
const detectPWA = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
  
  // Get current domain information
  const hostname = window.location.hostname;
  const isProductionDomain = hostname === 'triagenius-landing.lovable.app';
  const isPreviewDomain = hostname.includes('lovableproject.com');
  
  // Track the domain for analytics and debugging
  localStorage.setItem('pwa-domain', isProductionDomain ? 'production' : (isPreviewDomain ? 'preview' : 'other'));
  
  if (isStandalone) {
    console.log('Running as installed PWA on domain:', hostname);
    document.body.classList.add('standalone-mode');
    localStorage.setItem('isPWA', 'true');
    
    // Store initial service worker version
    if (navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data && event.data.version) {
          localStorage.setItem('pwa-version', event.data.version);
        }
      };
      
      // Send message to get version
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      );
    }
  } else {
    // Check if previously detected as PWA but now in browser
    const wasPWA = localStorage.getItem('isPWA') === 'true';
    if (wasPWA && !isStandalone) {
      // Keep PWA status if this appears to be a page refresh in the PWA
      if (document.referrer.includes(window.location.hostname)) {
        console.log('Refreshed PWA detected on domain:', hostname);
      } else {
        // Reset isPWA if opened in regular browser
        localStorage.removeItem('isPWA');
      }
    }
  }
  
  // Listen for standalone mode changes
  window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
    if (e.matches) {
      document.body.classList.add('standalone-mode');
      localStorage.setItem('isPWA', 'true');
    }
  });
};

// Detect PWA status immediately
detectPWA();

// Register service worker for PWA functionality with improved error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use the main service worker path (sw.js)
    const swUrl = '/sw.js';
    
    // More reliable service worker registration
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register(swUrl);
        console.log('Main service worker registered successfully:', registration.scope);
        
        // Handle updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('New content is available; please refresh.');
                
                // For PWA mode, use the toast notification system
                // (will be handled by the UpdateNotification component)
              } else {
                console.log('Content is cached for offline use.');
                // If this is first install, mark as PWA if in standalone mode
                detectPWA();
              }
            }
          };
        };
        
        // Enable background sync for focus sessions - with PWA detection and standardized tag name
        if ('SyncManager' in window && localStorage.getItem('isPWA') === 'true') {
          setTimeout(() => {
            try {
              // Standardize on "sync-focus-session" tag name
              // Use type assertion to handle the sync property that TypeScript doesn't recognize
              const syncRegistration = registration as unknown as { sync?: { register: (tag: string) => Promise<void> } };
              if (syncRegistration.sync) {
                syncRegistration.sync.register('sync-focus-session')
                  .then(() => console.log('Background sync registered successfully'))
                  .catch(err => console.log('Background sync registration failed:', err));
              }
            } catch (err) {
              console.error('Error accessing sync manager:', err);
            }
          }, 1000); // Delay to ensure service worker is fully active
        }
        
        // Listen for messages from the redirector service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'REGISTER_MAIN_SW') {
            console.log('Received instruction to register main SW');
            navigator.serviceWorker.register(event.data.swUrl)
              .then(reg => console.log('Main service worker registered via redirector'))
              .catch(err => console.error('Failed to register main service worker:', err));
          }
        });
        
        return registration;
      } catch (error) {
        console.error('Error during service worker registration:', error);
        return null;
      }
    };
    
    // Use requestIdleCallback to avoid blocking the main thread during initial load
    if ('requestIdleCallback' in window) {
      // @ts-ignore - TypeScript might not recognize requestIdleCallback
      window.requestIdleCallback(() => {
        registerSW();
      });
    } else {
      setTimeout(() => {
        registerSW();
      }, 1000);
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
}

// Create root outside of the render call
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = ReactDOM.createRoot(rootElement);

// Render with React.StrictMode and wrap with BrowserRouter and ThemeProvider
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

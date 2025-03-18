
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Toaster } from "./components/ui/toaster"
import { register } from './components/pwa/ServiceWorker'

// Only register service worker once in the main entry point
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    register();
    console.log('Service worker registered successfully');
  });
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

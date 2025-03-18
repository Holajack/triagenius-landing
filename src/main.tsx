
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
)


import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Toaster } from "./components/ui/toaster"
import { ToastProvider } from "./hooks/use-toast"
import { register } from './components/pwa/ServiceWorker'

// Register service worker with our enhanced implementation
register();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
      <Toaster />
    </ToastProvider>
  </React.StrictMode>
)

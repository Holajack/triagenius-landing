
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Toaster } from "./components/ui/toaster"
import { ToastProvider } from "./hooks/use-toast"
import { register } from './components/pwa/ServiceWorker'

// Only register service worker once in the main entry point
register();

// Create a wrapper component to use our new provider format
function ToastProviderWrapper({ children }: { children: React.ReactNode }) {
  const { Provider, providerProps } = ToastProvider({ children });
  return (
    <Provider {...providerProps} />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProviderWrapper>
      <App />
      <Toaster />
    </ToastProviderWrapper>
  </React.StrictMode>
)


import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RotateCw } from "lucide-react";

interface UpdateInfo {
  available: boolean;
  version?: string;
}

export function UpdateNotification() {
  const { toast } = useToast();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({ available: false });
  const isPWA = localStorage.getItem('isPWA') === 'true' || window.matchMedia('(display-mode: standalone)').matches;
  
  useEffect(() => {
    if (!isPWA || !('serviceWorker' in navigator)) return;
    
    // Check for updates when component mounts
    checkForUpdate();
    
    // Listen for update messages from the service worker
    const handleUpdateMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        setUpdateInfo({
          available: true,
          version: event.data.version
        });
        
        // Show toast notification for update
        toast({
          title: "Update Available",
          description: "A new version is available. Tap to refresh.",
          action: (
            <button 
              onClick={refreshApp}
              className="inline-flex items-center justify-center rounded-md border bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RotateCw className="h-4 w-4 mr-1" />
              Update
            </button>
          ),
          duration: 10000, // 10 seconds
        });
      }
    };
    
    // Add event listener for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleUpdateMessage);
    
    // Set up periodic update checks for PWA (every 30 minutes)
    const intervalId = setInterval(() => {
      checkForUpdate();
    }, 30 * 60 * 1000);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleUpdateMessage);
      clearInterval(intervalId);
    };
  }, [isPWA]);
  
  const checkForUpdate = async () => {
    if (!navigator.serviceWorker.controller) return;
    
    try {
      // Create a MessageChannel for the service worker to respond
      const messageChannel = new MessageChannel();
      
      // Set up the handler for the message response
      messageChannel.port1.onmessage = (event) => {
        if (event.data && event.data.version) {
          // Compare stored version with current version
          const storedVersion = localStorage.getItem('pwa-version');
          
          if (storedVersion && storedVersion !== event.data.version) {
            setUpdateInfo({
              available: true,
              version: event.data.version
            });
            
            // Show toast notification with proper domain detection
            const hostname = window.location.hostname;
            const isProduction = hostname === 'triagenius-landing.lovable.app';
            const isDev = hostname.includes('lovableproject.com');
            
            toast({
              title: "Update Available",
              description: `A new version is available${isProduction ? ' for production' : isDev ? ' on preview' : ''}. Tap to refresh.`,
              action: (
                <button 
                  onClick={refreshApp}
                  className="inline-flex items-center justify-center rounded-md border bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  Update
                </button>
              ),
              duration: 10000, // 10 seconds
            });
          }
          
          // Store the current version
          localStorage.setItem('pwa-version', event.data.version);
        }
      };
      
      // Send the message to check for updates
      navigator.serviceWorker.controller.postMessage(
        { type: 'CHECK_UPDATE' },
        [messageChannel.port2]
      );
    } catch (error) {
      console.error('Failed to check for update:', error);
    }
  };
  
  const refreshApp = () => {
    // Tell service worker to skip waiting if there's a new version
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      
      // Give the service worker a moment to activate the waiting worker
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } else {
      // Fallback - just reload the page
      window.location.reload();
    }
  };
  
  // This component doesn't render anything visible
  // It just sets up the update notification system
  return null;
}

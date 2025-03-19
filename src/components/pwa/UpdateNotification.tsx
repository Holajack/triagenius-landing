
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RotateCw, Download, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

interface UpdateInfo {
  available: boolean;
  version?: string;
}

export function UpdateNotification() {
  const { toast } = useToast();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({ available: false });
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Enhanced PWA detection
  const isPWA = localStorage.getItem('isPWA') === 'true' || 
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;
  
  // Check if on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
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
        
        // Show toast notification for update with native-like appearance
        showUpdateNotification();
      }
    };
    
    // Add event listener for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleUpdateMessage);
    
    // Set up periodic update checks for PWA (every 15 minutes)
    const intervalId = setInterval(() => {
      checkForUpdate();
    }, 15 * 60 * 1000);
    
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
            
            // Show update notification with enhanced mobile experience
            showUpdateNotification();
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
  
  const showUpdateNotification = () => {
    // Detect domain for more accurate update messaging
    const hostname = window.location.hostname;
    const isProduction = hostname === 'triagenius-landing.lovable.app' || hostname === 'triagenius.lovable.app';
    const isDev = hostname.includes('lovableproject.com');
    
    // Show different notification style for mobile PWA vs desktop
    if (isMobile && isPWA) {
      // Mobile PWA - native app-like notification
      toast({
        title: "Update Available",
        description: "A new version is available. Please update to ensure you have the latest features and improvements.",
        action: (
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 mt-2">
            <Button 
              onClick={refreshApp}
              className="inline-flex items-center justify-center"
              disabled={isUpdating}
              variant="default"
            >
              {isUpdating ? (
                <>
                  <RotateCw className="h-4 w-4 mr-1 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Update Now
                </>
              )}
            </Button>
          </div>
        ),
        duration: 0, // Don't auto-dismiss
      });
    } else {
      // Desktop or non-PWA - standard notification
      toast({
        title: "Update Available",
        description: `A new version is available${isProduction ? ' for production' : isDev ? ' on preview' : ''}. Tap to refresh.`,
        action: (
          <Button 
            onClick={refreshApp}
            className="inline-flex items-center justify-center"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Update
          </Button>
        ),
        duration: 10000, // 10 seconds
      });
    }
  };
  
  const refreshApp = () => {
    setIsUpdating(true);
    
    // Tell service worker to skip waiting if there's a new version
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      
      // Show updating toast
      toast({
        title: "Updating...",
        description: "Installing the latest version",
        action: (
          <RotateCw className="h-4 w-4 animate-spin" />
        ),
        duration: 3000,
      });
      
      // Give the service worker a moment to activate the waiting worker
      setTimeout(() => {
        toast({
          title: "Update Complete",
          description: "The app has been updated to the latest version",
          action: <CheckCircle className="h-4 w-4 text-green-500" />,
          duration: 3000,
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 2000);
    } else {
      // Fallback - just reload the page
      window.location.reload();
    }
  };
  
  // This component doesn't render anything visible
  // It just sets up the update notification system
  return null;
}

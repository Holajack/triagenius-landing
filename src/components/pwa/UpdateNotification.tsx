
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RotateCw, Download, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpdateInfo {
  available: boolean;
  version?: string;
  timestamp?: number;
}

export function UpdateNotification() {
  const { toast } = useToast();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({ available: false });
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  
  // Enhanced PWA detection
  const isPWA = localStorage.getItem('isPWA') === 'true' || 
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;
  
  // Check if on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    // More aggressive update checks for PWA users
    const checkIntervalTime = isPWA ? 1 * 60 * 1000 : 5 * 60 * 1000; // 1 min for PWA, 5 min for browser
    
    // Check for updates when component mounts
    checkForUpdate(true);
    
    // Listen for update messages from the service worker
    const handleUpdateMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        setUpdateInfo({
          available: true,
          version: event.data.version,
          timestamp: event.data.timestamp
        });
        
        // Show toast notification for update with native-like appearance
        showUpdateNotification();
      }
      
      // Handle activated update message
      if (event.data && event.data.type === 'UPDATE_ACTIVATED') {
        toast({
          title: "Update Activated",
          description: "The app will refresh momentarily to apply updates",
          duration: 3000,
        });
        
        // Give some time for the toast to be seen before refreshing
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    };
    
    // Add event listener for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleUpdateMessage);
    
    // Set up periodic update checks
    const intervalId = setInterval(() => {
      const now = Date.now();
      // Only check if it's been at least the interval time since the last check
      if (now - lastCheckTime >= checkIntervalTime) {
        checkForUpdate();
        setLastCheckTime(now);
      }
    }, checkIntervalTime);
    
    // Additional forced check when the app regains focus (user returns to the app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only check if it's been at least 30 seconds since the last check
        const now = Date.now();
        if (now - lastCheckTime >= 30000) {
          checkForUpdate();
          setLastCheckTime(now);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // For PWA, check more frequently during the first 5 minutes after launch
    if (isPWA) {
      const quickCheckIntervalId = setInterval(() => {
        checkForUpdate();
      }, 20000); // Check every 20 seconds
      
      // Clear the quick check interval after 5 minutes
      setTimeout(() => {
        clearInterval(quickCheckIntervalId);
      }, 5 * 60 * 1000);
    }
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleUpdateMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [isPWA, lastCheckTime]);
  
  const checkForUpdate = async (isInitialCheck = false) => {
    if (!navigator.serviceWorker.controller) return;
    
    try {
      // First, try direct fetch to check if sw.js has changed
      const swUrl = `${window.location.origin}/sw.js?cacheBust=${Date.now()}`;
      
      // For PWAs or initial checks, use direct network check
      if (isPWA || isInitialCheck) {
        try {
          const response = await fetch('/check-for-updates', { cache: 'no-store' });
          if (response.ok) {
            const data = await response.json();
            
            // Compare with stored version
            const storedVersion = localStorage.getItem('pwa-version');
            const storedTimestamp = localStorage.getItem('pwa-timestamp');
            
            if ((storedVersion && storedVersion !== data.version) || 
                (storedTimestamp && parseInt(storedTimestamp) < data.timestamp)) {
              setUpdateInfo({
                available: true,
                version: data.version,
                timestamp: data.timestamp
              });
              
              // Show update notification
              showUpdateNotification();
              
              // Update stored values
              localStorage.setItem('pwa-version', data.version);
              localStorage.setItem('pwa-timestamp', data.timestamp.toString());
            }
          }
        } catch (error) {
          // If direct fetch fails, try MessageChannel approach
          useMessageChannelForUpdate();
        }
      } else {
        // For browser users, just use message channel
        useMessageChannelForUpdate();
      }
    } catch (error) {
      console.error('Failed to check for update:', error);
    }
  };
  
  const useMessageChannelForUpdate = () => {
    // Create a MessageChannel for the service worker to respond
    const messageChannel = new MessageChannel();
    
    // Set up the handler for the message response
    messageChannel.port1.onmessage = (event) => {
      if (event.data && event.data.version) {
        // Compare stored version with current version
        const storedVersion = localStorage.getItem('pwa-version');
        const storedTimestamp = localStorage.getItem('pwa-timestamp');
        
        if ((storedVersion && storedVersion !== event.data.version) || 
            (storedTimestamp && parseInt(storedTimestamp) < event.data.timestamp)) {
          setUpdateInfo({
            available: true,
            version: event.data.version,
            timestamp: event.data.timestamp
          });
          
          // Show update notification
          showUpdateNotification();
          
          // Update stored values
          localStorage.setItem('pwa-version', event.data.version);
          localStorage.setItem('pwa-timestamp', event.data.timestamp.toString());
        }
      }
    };
    
    // Send the message to check for updates
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(
        { type: 'CHECK_UPDATE' },
        [messageChannel.port2]
      );
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
    
    try {
      // More reliable update method - first try FORCE_UPDATE message
      if (navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        
        // Set up response handler
        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.updated) {
            // Show updating toast
            toast({
              title: "Updating...",
              description: "Installing the latest version",
              action: (
                <RotateCw className="h-4 w-4 animate-spin" />
              ),
              duration: 3000,
            });
            
            // The service worker will trigger a reload after the update is complete
            // But we'll also set a safety timeout
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
            // Fallback - just use the regular method
            regularUpdateMethod();
          }
        };
        
        // Send the force update message
        navigator.serviceWorker.controller.postMessage(
          { type: 'FORCE_UPDATE' },
          [messageChannel.port2]
        );
        
        // Set a timeout in case the message channel doesn't work
        setTimeout(() => {
          regularUpdateMethod();
        }, 3000);
      } else {
        // No service worker controller, use regular method
        regularUpdateMethod();
      }
    } catch (error) {
      console.error('Error during force update:', error);
      regularUpdateMethod();
    }
  };
  
  const regularUpdateMethod = () => {
    // Tell service worker to skip waiting
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    
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
  };
  
  // This component doesn't render anything visible
  // It just sets up the update notification system
  return null;
}

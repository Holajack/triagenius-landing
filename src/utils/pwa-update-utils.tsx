import React from "react";
import { RotateCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Track notification state to prevent duplicates
let lastUpdateNotificationTime = 0;
let lastNotifiedVersion = '';
const NOTIFICATION_COOLDOWN = 60 * 60 * 1000; // 1 hour cooldown

// Export the toast function to show update notifications
export function showUpdateNotification(isUserBased = false, isMobile = false, isPWA = false, refreshApp: () => void, isUpdating = false) {
  // Detect domain for more accurate update messaging
  const hostname = window.location.hostname;
  const isProduction = hostname === 'triagenius-landing.lovable.app' || hostname === 'triagenius.lovable.app';
  const isDev = hostname.includes('lovableproject.com');
  
  // Check for duplicate notifications
  const now = Date.now();
  const storedVersion = localStorage.getItem('notified-version');
  
  if (storedVersion && storedVersion === lastNotifiedVersion && 
      now - lastUpdateNotificationTime < NOTIFICATION_COOLDOWN) {
    console.log('Suppressing duplicate update notification');
    return;
  }
  
  // Update tracking state
  lastUpdateNotificationTime = now;
  lastNotifiedVersion = localStorage.getItem('pwa-version') || 'unknown';
  localStorage.setItem('notified-version', lastNotifiedVersion);
  
  // Customize message based on source
  const updateMessage = isUserBased ? 
    "A new version was released since your last login. Please update to ensure you have the latest features." :
    "A new version is available. Please update to ensure you have the latest features and improvements.";
  
  // Dismiss any existing update notifications first
  toast.dismiss('update-notification');
  
  // Show different notification style for mobile PWA vs desktop
  if (isMobile && isPWA) {
    // Mobile PWA - native app-like notification
    toast.custom((t) => (
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col space-y-1">
          <h3 className="font-semibold">Update Available</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{updateMessage}</p>
        </div>
        <div className="flex justify-end items-center">
          <button 
            onClick={refreshApp}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <RotateCw className="h-4 w-4 mr-1 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Update Now
              </>
            )}
          </button>
        </div>
      </div>
    ), { duration: 0, id: 'update-notification' }); // Use consistent ID
  } else {
    // Desktop or non-PWA - standard notification
    toast.message("Update Available", {
      id: 'update-notification', // Use consistent ID
      description: `${updateMessage}${isProduction ? ' for production' : isDev ? ' on preview' : ''}. Tap to refresh.`,
      action: {
        label: "Update",
        onClick: refreshApp,
      },
      duration: 10000, // 10 seconds
    });
  }
}

// Check for updates function with improved deduplication
export const checkForUpdate = async (
  isInitialCheck = false, 
  user: any, 
  setUpdateInfo: (info: {available: boolean, version?: string, timestamp?: number}) => void,
  setLastCheckTime: React.Dispatch<React.SetStateAction<number>>
) => {
  if (!navigator.serviceWorker?.controller) return;
  
  // Update last check time
  setLastCheckTime(Date.now());
  
  try {
    // First, try direct fetch to check if sw.js has changed
    const queryParams = new URLSearchParams({
      cacheBust: Date.now().toString(),
      ...(user?.id ? { userId: user.id } : {})
    }).toString();
    
    const isPWA = localStorage.getItem('isPWA') === 'true' || 
                  window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone === true;
    
    const swUrl = `${window.location.origin}/check-for-updates?${queryParams}`;
    
    // For PWAs or initial checks, use direct network check
    if (isPWA || isInitialCheck) {
      try {
        const response = await fetch(swUrl, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          
          // Compare with stored version
          const storedVersion = localStorage.getItem('pwa-version');
          const storedTimestamp = localStorage.getItem('pwa-timestamp');
          
          // Also check user-specific stored version if user is logged in
          const userSpecificVersion = user?.id ? 
            localStorage.getItem(`pwa-version-${user.id}`) : null;
          
          // Avoid notifying about the same version we've already notified about
          const lastNotifiedVersion = localStorage.getItem('notified-version');
          const lastNotificationTime = localStorage.getItem('last-notification-time');
          
          const isDuplicate = lastNotifiedVersion === data.version && 
                             lastNotificationTime && 
                             (Date.now() - parseInt(lastNotificationTime)) < NOTIFICATION_COOLDOWN;
          
          if (!isDuplicate && 
              ((storedVersion && storedVersion !== data.version) || 
              (storedTimestamp && parseInt(storedTimestamp) < data.timestamp) ||
              (userSpecificVersion && userSpecificVersion !== data.version))) {
            
            // Update stored values
            localStorage.setItem('pwa-version', data.version);
            localStorage.setItem('pwa-timestamp', data.timestamp.toString());
            localStorage.setItem('notified-version', data.version);
            localStorage.setItem('last-notification-time', Date.now().toString());
            
            // Also update user-specific version if user is logged in
            if (user?.id) {
              localStorage.setItem(`pwa-version-${user.id}`, data.version);
            }
            
            setUpdateInfo({
              available: true,
              version: data.version,
              timestamp: data.timestamp
            });
          }
        }
      } catch (error) {
        // If direct fetch fails, try MessageChannel approach
        useMessageChannelForUpdate(user, setUpdateInfo);
      }
    } else {
      // For browser users, just use message channel
      useMessageChannelForUpdate(user, setUpdateInfo);
    }
  } catch (error) {
    console.error('Failed to check for update:', error);
  }
};

// Use message channel for update checking with deduplication
const useMessageChannelForUpdate = (
  user: any, 
  setUpdateInfo: (info: {available: boolean, version?: string, timestamp?: number}) => void
) => {
  // Create a MessageChannel for the service worker to respond
  const messageChannel = new MessageChannel();
  
  // Set up the handler for the message response
  messageChannel.port1.onmessage = (event) => {
    if (event.data && event.data.version) {
      // Compare stored version with current version
      const storedVersion = localStorage.getItem('pwa-version');
      const storedTimestamp = localStorage.getItem('pwa-timestamp');
      
      // Also check user-specific stored version if user is logged in
      const userSpecificVersion = user?.id ? 
        localStorage.getItem(`pwa-version-${user.id}`) : null;
      
      // Check for duplicate notifications
      const lastNotifiedVersion = localStorage.getItem('notified-version');
      const lastNotificationTime = localStorage.getItem('last-notification-time');
      
      const isDuplicate = lastNotifiedVersion === event.data.version && 
                         lastNotificationTime && 
                         (Date.now() - parseInt(lastNotificationTime)) < NOTIFICATION_COOLDOWN;
      
      if (!isDuplicate && 
          ((storedVersion && storedVersion !== event.data.version) || 
          (storedTimestamp && parseInt(storedTimestamp) < event.data.timestamp) ||
          (userSpecificVersion && userSpecificVersion !== event.data.version))) {
        
        // Update stored values
        localStorage.setItem('pwa-version', event.data.version);
        localStorage.setItem('pwa-timestamp', event.data.timestamp.toString());
        localStorage.setItem('notified-version', event.data.version);
        localStorage.setItem('last-notification-time', Date.now().toString());
        
        // Also update user-specific version if user is logged in
        if (user?.id) {
          localStorage.setItem(`pwa-version-${user.id}`, event.data.version);
        }
        
        setUpdateInfo({
          available: true,
          version: event.data.version,
          timestamp: event.data.timestamp
        });
      }
    }
  };
  
  // Send the message to check for updates
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(
      { 
        type: 'CHECK_UPDATE',
        userId: user?.id
      },
      [messageChannel.port2]
    );
  }
};

// Refresh app function - keep this unchanged
export const refreshApp = (setIsUpdating: React.Dispatch<React.SetStateAction<boolean>>) => {
  setIsUpdating(true);
  
  try {
    // More reliable update method - first try FORCE_UPDATE message
    if (navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      // Set up response handler
      messageChannel.port1.onmessage = (event) => {
        if (event.data && event.data.updated) {
          // Show updating toast
          toast.message("Updating...", {
            description: "Installing the latest version",
            icon: <RotateCw className="h-4 w-4 animate-spin" />,
            duration: 3000,
          });
          
          // The service worker will trigger a reload after the update is complete
          // But we'll also set a safety timeout
          setTimeout(() => {
            toast.message("Update Complete", {
              description: "The app has been updated to the latest version",
              icon: <CheckCircle className="h-4 w-4 text-green-500" />,
              duration: 3000,
            });
            
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }, 2000);
        } else {
          // Fallback - just use the regular method
          regularUpdateMethod(setIsUpdating);
        }
      };
      
      // Send the force update message
      navigator.serviceWorker.controller.postMessage(
        { type: 'FORCE_UPDATE' },
        [messageChannel.port2]
      );
      
      // Set a timeout in case the message channel doesn't work
      setTimeout(() => {
        regularUpdateMethod(setIsUpdating);
      }, 3000);
    } else {
      // No service worker controller, use regular method
      regularUpdateMethod(setIsUpdating);
    }
  } catch (error) {
    console.error('Error during force update:', error);
    regularUpdateMethod(setIsUpdating);
  }
};

// Regular update method - keep this unchanged
const regularUpdateMethod = (setIsUpdating: React.Dispatch<React.SetStateAction<boolean>>) => {
  // Tell service worker to skip waiting
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
  
  // Show updating toast
  toast.message("Updating...", {
    description: "Installing the latest version",
    icon: <RotateCw className="h-4 w-4 animate-spin" />,
    duration: 3000,
  });
  
  // Give the service worker a moment to activate the waiting worker
  setTimeout(() => {
    toast.message("Update Complete", {
      description: "The app has been updated to the latest version",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      duration: 3000,
    });
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, 2000);
};

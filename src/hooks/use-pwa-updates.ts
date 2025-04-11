import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { 
  checkForAuthAwareUpdates, 
  notifyServiceWorkerAboutUser 
} from "@/components/ServiceWorker";
import { checkForUpdate, refreshApp } from "@/utils/pwa-update-utils";

interface UpdateInfo {
  available: boolean;
  version?: string;
  timestamp?: number;
}

// Track notification state globally to prevent duplicates across component remounts
const notificationState = {
  lastNotificationTime: 0,
  lastVersion: '',
  notificationShown: false,
  cooldownPeriod: 60 * 60 * 1000, // 1 hour cooldown between same notifications
};

export function usePwaUpdates() {
  const { user } = useUser();
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
    
    // More deliberate update checks - reduced frequency
    const checkIntervalTime = isPWA ? 5 * 60 * 1000 : 15 * 60 * 1000; // 5 min for PWA, 15 min for browser
    
    // Only check for updates when component mounts if we haven't shown a notification recently
    const shouldCheckOnMount = !notificationState.notificationShown || 
                              (Date.now() - notificationState.lastNotificationTime > notificationState.cooldownPeriod);
    
    if (shouldCheckOnMount) {
      // Initial check with debounce
      setTimeout(() => {
        checkForUpdate(true, user, handleUpdateAvailable, setLastCheckTime);
      }, 3000); // Delay initial check to avoid race conditions
    }
    
    // Single event handler for all update-related messages
    const handleUpdateMessage = (event: MessageEvent) => {
      if (!event.data || !event.data.type) return;
      
      switch (event.data.type) {
        case 'UPDATE_AVAILABLE':
        case 'UPDATE_AVAILABLE_AFTER_LOGIN':
          // Prevent duplicate notifications for the same version
          if (event.data.version === notificationState.lastVersion && 
              Date.now() - notificationState.lastNotificationTime < notificationState.cooldownPeriod) {
            console.log('Suppressing duplicate update notification for version:', event.data.version);
            return;
          }
          
          handleUpdateAvailable({
            available: true,
            version: event.data.version,
            timestamp: event.data.timestamp
          });
          break;
          
        case 'UPDATE_ACTIVATED':
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          break;
      }
    };
    
    // Update handler function that prevents duplicates
    function handleUpdateAvailable(info: UpdateInfo) {
      // Skip if this is the same version we already notified about recently
      if (info.version === notificationState.lastVersion && 
          Date.now() - notificationState.lastNotificationTime < notificationState.cooldownPeriod) {
        return;
      }
      
      // Update global tracking state
      notificationState.notificationShown = true;
      notificationState.lastNotificationTime = Date.now();
      notificationState.lastVersion = info.version || '';
      
      // Update component state
      setUpdateInfo(info);
    }
    
    // Add event listener for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleUpdateMessage);
    
    // Set up periodic update checks with reduced frequency
    const intervalId = setInterval(() => {
      const now = Date.now();
      // Only check if it's been at least the interval time since the last check
      if (now - lastCheckTime >= checkIntervalTime) {
        checkForUpdate(false, user, handleUpdateAvailable, setLastCheckTime);
        setLastCheckTime(now);
      }
    }, checkIntervalTime);
    
    // Additional check when the app regains focus, but less frequently
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only check if it's been at least 5 minutes since the last check
        const now = Date.now();
        if (now - lastCheckTime >= 5 * 60 * 1000) {
          checkForUpdate(false, user, handleUpdateAvailable, setLastCheckTime);
          setLastCheckTime(now);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // For PWA, more moderate check schedule - once per 1 minute for the first 5 minutes
    let quickCheckIntervalId: number | undefined;
    if (isPWA) {
      quickCheckIntervalId = window.setInterval(() => {
        // Skip checks if notification already shown recently
        if (notificationState.notificationShown && 
            Date.now() - notificationState.lastNotificationTime < 60 * 1000) {
          return;
        }
        
        checkForUpdate(false, user, handleUpdateAvailable, setLastCheckTime);
      }, 60 * 1000); // Check every 60 seconds instead of 20
      
      // Clear the quick check interval after 5 minutes
      setTimeout(() => {
        if (quickCheckIntervalId) {
          clearInterval(quickCheckIntervalId);
        }
      }, 5 * 60 * 1000);
    }
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleUpdateMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      if (quickCheckIntervalId) {
        clearInterval(quickCheckIntervalId);
      }
    };
  }, [isPWA, lastCheckTime, user]);
  
  // Effect for handling user authentication state - keep this minimal
  useEffect(() => {
    // Only process user auth once per session
    const userChecked = sessionStorage.getItem(`user-update-check-${user?.id}`);
    if (user && user.id && !userChecked) {
      handleUserAuthenticated(user);
      sessionStorage.setItem(`user-update-check-${user.id}`, 'true');
    }
  }, [user]);
  
  // Listen for Supabase auth changes, but limit frequency
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userChecked = sessionStorage.getItem(`user-update-check-${session.user.id}`);
        if (!userChecked) {
          handleUserAuthenticated(session.user);
          sessionStorage.setItem(`user-update-check-${session.user.id}`, 'true');
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Handle authenticated user and check for updates
  const handleUserAuthenticated = async (userData: any) => {
    if (!userData || !userData.id) return;
    
    // Skip if we've checked for this user recently
    const lastUserCheck = localStorage.getItem(`last-user-check-${userData.id}`);
    if (lastUserCheck && Date.now() - parseInt(lastUserCheck) < 15 * 60 * 1000) {
      return;
    }
    
    console.log('User authenticated, checking for user-specific updates');
    
    try {
      // Notify service worker about authenticated user
      await notifyServiceWorkerAboutUser({
        id: userData.id,
        email: userData.email,
        lastLogin: localStorage.getItem(`last-login-${userData.id}`) || Date.now().toString()
      });
      
      // Check for auth-aware updates
      const updateCheck = await checkForAuthAwareUpdates(userData.id);
      
      if (updateCheck.updateAvailable) {
        // Use the same handler to prevent duplicates
        setUpdateInfo({
          available: true,
          version: updateCheck.version,
          timestamp: updateCheck.timestamp
        });
        
        // Update notification tracking
        notificationState.notificationShown = true;
        notificationState.lastNotificationTime = Date.now();
        notificationState.lastVersion = updateCheck.version || '';
      }
      
      // Store current login time for future reference
      localStorage.setItem(`last-login-${userData.id}`, Date.now().toString());
      localStorage.setItem(`last-user-check-${userData.id}`, Date.now().toString());
    } catch (error) {
      console.error('Error checking for user-specific updates:', error);
    }
  };

  const handleRefreshApp = () => {
    setIsUpdating(true);
    refreshApp(setIsUpdating);
    
    // Clear notification state on refresh
    notificationState.notificationShown = false;
  };

  return {
    updateInfo,
    isUpdating,
    isPWA,
    isMobile,
    handleRefreshApp
  };
}


import { useState, useEffect } from "react";
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
    
    // More aggressive update checks for PWA users
    const checkIntervalTime = isPWA ? 1 * 60 * 1000 : 5 * 60 * 1000; // 1 min for PWA, 5 min for browser
    
    // Check for updates when component mounts
    checkForUpdate(true, user, setUpdateInfo, setLastCheckTime);
    
    // Listen for update messages from the service worker
    const handleUpdateMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        setUpdateInfo({
          available: true,
          version: event.data.version,
          timestamp: event.data.timestamp
        });
      }
      
      // Handle new message type for user-based updates
      if (event.data && event.data.type === 'UPDATE_AVAILABLE_AFTER_LOGIN') {
        setUpdateInfo({
          available: true,
          version: event.data.version,
          timestamp: event.data.timestamp
        });
      }
      
      // Handle activated update message
      if (event.data && event.data.type === 'UPDATE_ACTIVATED') {
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
        checkForUpdate(false, user, setUpdateInfo, setLastCheckTime);
        setLastCheckTime(now);
      }
    }, checkIntervalTime);
    
    // Additional forced check when the app regains focus (user returns to the app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only check if it's been at least 30 seconds since the last check
        const now = Date.now();
        if (now - lastCheckTime >= 30000) {
          checkForUpdate(false, user, setUpdateInfo, setLastCheckTime);
          setLastCheckTime(now);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // For PWA, check more frequently during the first 5 minutes after launch
    let quickCheckIntervalId: number | undefined;
    if (isPWA) {
      quickCheckIntervalId = window.setInterval(() => {
        checkForUpdate(false, user, setUpdateInfo, setLastCheckTime);
      }, 20000); // Check every 20 seconds
      
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
  
  // Effect for handling user authentication state
  useEffect(() => {
    if (user && user.id) {
      handleUserAuthenticated(user);
    }
  }, [user]);
  
  // Listen for Supabase auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        handleUserAuthenticated(session.user);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Handle authenticated user and check for updates
  const handleUserAuthenticated = async (userData: any) => {
    if (!userData || !userData.id) return;
    
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
        setUpdateInfo({
          available: true,
          version: updateCheck.version,
          timestamp: updateCheck.timestamp
        });
      }
      
      // Store current login time for future reference
      localStorage.setItem(`last-login-${userData.id}`, Date.now().toString());
    } catch (error) {
      console.error('Error checking for user-specific updates:', error);
    }
  };

  const handleRefreshApp = () => {
    setIsUpdating(true);
    refreshApp(setIsUpdating);
  };

  return {
    updateInfo,
    isUpdating,
    isPWA,
    isMobile,
    handleRefreshApp
  };
}

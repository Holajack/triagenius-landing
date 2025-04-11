
import React, { useEffect, useRef } from "react";
import { usePwaUpdates } from "@/hooks/use-pwa-updates";
import { showUpdateNotification } from "@/utils/pwa-update-utils";

export function UpdateNotification() {
  const { 
    updateInfo, 
    isUpdating, 
    isPWA, 
    isMobile,
    handleRefreshApp 
  } = usePwaUpdates();
  
  // Track if we've shown a notification to prevent duplicates within a component lifecycle
  const notificationShownRef = useRef(false);
  
  // Show notification when update is available, with debouncing
  useEffect(() => {
    // Don't show notification if we've already shown one in this component instance
    if (updateInfo.available && !notificationShownRef.current) {
      // Mark that we've shown a notification
      notificationShownRef.current = true;
      
      // Delay slightly to avoid multiple notifications during initial render cascade
      const timer = setTimeout(() => {
        showUpdateNotification(false, isMobile, isPWA, handleRefreshApp, isUpdating);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [updateInfo.available, isMobile, isPWA, isUpdating, handleRefreshApp]);
  
  // Reset notification state when component unmounts
  useEffect(() => {
    return () => {
      notificationShownRef.current = false;
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
}

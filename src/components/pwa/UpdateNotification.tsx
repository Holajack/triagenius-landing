
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
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Show notification when update is available, with debouncing
  useEffect(() => {
    // Clear any existing timer when component updates
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    
    // Don't show notification if we've already shown one in this component instance
    if (updateInfo.available && !notificationShownRef.current) {
      // Mark that we've shown a notification
      notificationShownRef.current = true;
      
      // Delay slightly to avoid multiple notifications during initial render cascade
      notificationTimerRef.current = setTimeout(() => {
        showUpdateNotification(false, isMobile, isPWA, handleRefreshApp, isUpdating);
        notificationTimerRef.current = null;
      }, 1000);
    }
    
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
    };
  }, [updateInfo.available, isMobile, isPWA, isUpdating, handleRefreshApp]);
  
  // Reset notification state when component unmounts
  useEffect(() => {
    return () => {
      notificationShownRef.current = false;
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
}

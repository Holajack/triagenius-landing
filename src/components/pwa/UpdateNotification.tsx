
import React, { useEffect } from "react";
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
  
  // Show notification when update is available
  useEffect(() => {
    if (updateInfo.available) {
      showUpdateNotification(false, isMobile, isPWA, handleRefreshApp, isUpdating);
    }
  }, [updateInfo.available, isMobile, isPWA, isUpdating, handleRefreshApp]);
  
  // This component doesn't render anything visible
  // It just sets up the update notification system
  return null;
}

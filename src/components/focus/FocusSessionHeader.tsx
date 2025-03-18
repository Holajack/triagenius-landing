
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Battery, BatteryLow } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";

interface FocusSessionHeaderProps {
  lowPowerMode: boolean;
  toggleLowPowerMode: () => void;
  operationInProgress: boolean;
}

const FocusSessionHeader: React.FC<FocusSessionHeaderProps> = ({
  lowPowerMode,
  toggleLowPowerMode,
  operationInProgress
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const isMountedRef = useRef(true);
  const timeoutIdRef = useRef<number | null>(null);
  
  // Set mounted flag and handle cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, []);
  
  // Reset toggling state after a timeout
  useEffect(() => {
    if (isToggling && isMountedRef.current) {
      // Clear any existing timeout
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current);
      }
      
      timeoutIdRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          setIsToggling(false);
        }
        timeoutIdRef.current = null;
      }, 1000);
    }
    
    return () => {
      if (timeoutIdRef.current) {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [isToggling]);
  
  const handleLowPowerToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Prevent multiple rapid clicks
    if (isToggling || operationInProgress || !isMountedRef.current) {
      return;
    }
    
    setIsToggling(true);
    
    // Cancel any pending animations for smoother transitions
    if (window.cancelAnimationFrame) {
      const maxId = 100; // Safety limit
      const currentId = window.requestAnimationFrame(() => {});
      for (let i = currentId; i > currentId - maxId; i--) {
        window.cancelAnimationFrame(i);
      }
    }
    
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      if (isMountedRef.current) {
        // Call the toggle function
        toggleLowPowerMode();
      }
    });
  };

  return (
    <div className="flex justify-between items-center">
      <PageHeader title="Focus Session" subtitle="Stay focused and achieve your goals" />
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleLowPowerToggle}
        title={lowPowerMode ? "Switch to enhanced mode" : "Switch to low power mode"}
        disabled={isToggling || operationInProgress}
        className="relative" // Add relative positioning for better click handling
      >
        {lowPowerMode ? <Battery className="h-5 w-5" /> : <BatteryLow className="h-5 w-5" />}
      </Button>
    </div>
  );
};

export default FocusSessionHeader;

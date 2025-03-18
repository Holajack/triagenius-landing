
import React, { useState, useEffect } from "react";
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
  
  // Reset toggling state after a timeout
  useEffect(() => {
    let timeoutId: number | undefined;
    
    if (isToggling) {
      timeoutId = window.setTimeout(() => {
        setIsToggling(false);
      }, 1000);
    }
    
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isToggling]);
  
  const handleLowPowerToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Prevent multiple rapid clicks
    if (isToggling || operationInProgress) {
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
    
    // Small delay to ensure UI is ready for state change
    setTimeout(() => {
      // Call the toggle function
      toggleLowPowerMode();
    }, 5);
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

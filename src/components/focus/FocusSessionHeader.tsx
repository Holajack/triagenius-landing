
import React, { useRef, useEffect } from "react";
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
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  
  // Track renders
  useEffect(() => {
    renderCountRef.current++;
    const now = Date.now();
    const elapsed = now - lastRenderTimeRef.current;
    console.log(`FocusSessionHeader: Render #${renderCountRef.current} at ${now}, ${elapsed}ms since last render`);
    lastRenderTimeRef.current = now;
  });
  
  const handleLowPowerToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const clickTime = Date.now();
    console.log(`FocusSessionHeader: Low power toggle button clicked at ${clickTime}, operationInProgress=${operationInProgress}`);
    
    if (operationInProgress) {
      console.log("FocusSessionHeader: Toggle ignored due to operation in progress");
      return;
    }
    
    console.log(`FocusSessionHeader: Calling toggleLowPowerMode at ${Date.now()}`);
    toggleLowPowerMode();
    
    // Log after the toggle
    setTimeout(() => {
      console.log(`FocusSessionHeader: ${Date.now() - clickTime}ms after toggle click`);
    }, 10);
    
    setTimeout(() => {
      console.log(`FocusSessionHeader: ${Date.now() - clickTime}ms after toggle click (longer check)`);
    }, 100);
  };

  return (
    <div className="flex justify-between items-center">
      <PageHeader title="Focus Session" subtitle="Stay focused and achieve your goals" />
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleLowPowerToggle}
        title={lowPowerMode ? "Switch to enhanced mode" : "Switch to low power mode"}
        disabled={operationInProgress}
      >
        {lowPowerMode ? <Battery className="h-5 w-5" /> : <BatteryLow className="h-5 w-5" />}
      </Button>
    </div>
  );
};

export default FocusSessionHeader;

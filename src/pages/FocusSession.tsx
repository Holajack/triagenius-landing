
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFocusSession } from "@/hooks/use-focus-session";
import { MotivationalDialog } from "@/components/focus/MotivationalDialog";
import { ConfirmEndDialog } from "@/components/focus/ConfirmEndDialog";
import FocusSessionHeader from "@/components/focus/FocusSessionHeader";
import FocusSessionContent from "@/components/focus/FocusSessionContent";

const FocusSession = () => {
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const renderCountRef = useRef(0);
  const lastOperationRef = useRef<{type: string, timestamp: number} | null>(null);
  
  // For tracking render performance
  useEffect(() => {
    renderCountRef.current++;
    console.log(`FocusSession: Render #${renderCountRef.current} at ${Date.now()}`);
    
    if (lastOperationRef.current) {
      console.log(`FocusSession: Time since last operation (${lastOperationRef.current.type}): ${Date.now() - lastOperationRef.current.timestamp}ms`);
    }
  });
  
  const {
    // State
    isPaused,
    showMotivation,
    currentMilestone,
    isCelebrating,
    lowPowerMode,
    segmentProgress,
    showEndConfirmation,
    
    // Refs
    timerRef,
    operationInProgressRef,
    
    // Handlers
    handlePause,
    handleResume,
    handleSessionEnd,
    handleMilestoneReached,
    handleProgressUpdate,
    toggleLowPowerMode,
    
    // Setters
    setShowMotivation,
    setShowEndConfirmation
  } = useFocusSession();

  useEffect(() => {
    console.log("FocusSession: Component mounted at", Date.now());
    console.log("FocusSession: Initial state:", { 
      isPaused, 
      showEndConfirmation, 
      currentMilestone,
      environment: state.environment
    });
    
    return () => {
      console.log("FocusSession: Component unmounting at", Date.now());
    };
  }, []);

  // Monitor end confirmation dialog state
  useEffect(() => {
    console.log(`FocusSession: showEndConfirmation changed to ${showEndConfirmation} at ${Date.now()}`);
  }, [showEndConfirmation]);
  
  // Monitor low power mode changes
  useEffect(() => {
    console.log(`FocusSession: lowPowerMode changed to ${lowPowerMode} at ${Date.now()}`);
  }, [lowPowerMode]);
  
  const handleLowPowerModeToggle = () => {
    console.log(`FocusSession: Low power mode toggle requested at ${Date.now()}`);
    lastOperationRef.current = {type: 'toggleLowPowerMode', timestamp: Date.now()};
    toggleLowPowerMode();
  };
  
  const handleEndSessionClick = () => {
    console.log(`FocusSession: End session button clicked at ${Date.now()}`);
    lastOperationRef.current = {type: 'endSessionClick', timestamp: Date.now()};
    console.log("FocusSession: End session button clicked, showing confirmation dialog");
    setShowEndConfirmation(true);
  };

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col items-center p-4 overflow-hidden",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <div className="w-full max-w-4xl">
        <FocusSessionHeader 
          lowPowerMode={lowPowerMode}
          toggleLowPowerMode={handleLowPowerModeToggle}
          operationInProgress={operationInProgressRef.current}
        />
        
        <FocusSessionContent 
          timerRef={timerRef}
          onPause={handlePause}
          onResume={handleResume}
          onComplete={handleSessionEnd}
          onMilestoneReached={handleMilestoneReached}
          onProgressUpdate={handleProgressUpdate}
          isPaused={isPaused}
          onEndSessionClick={handleEndSessionClick}
          lowPowerMode={lowPowerMode}
          environment={state.environment}
          currentMilestone={currentMilestone}
          isCelebrating={isCelebrating}
          segmentProgress={segmentProgress}
        />
      </div>

      <MotivationalDialog
        open={showMotivation}
        onClose={() => setShowMotivation(false)}
      />

      <ConfirmEndDialog
        open={showEndConfirmation}
        onOpenChange={(open) => {
          console.log(`FocusSession: ConfirmEndDialog onOpenChange called with ${open} at ${Date.now()}`);
          setShowEndConfirmation(open);
        }}
      />
    </div>
  );
};

export default FocusSession;

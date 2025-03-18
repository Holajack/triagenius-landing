
import { useState, useEffect } from "react";
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
    handleEndSessionConfirm,
    handleMilestoneReached,
    handleProgressUpdate,
    toggleLowPowerMode,
    
    // Setters
    setShowMotivation,
    setShowEndConfirmation
  } = useFocusSession();

  useEffect(() => {
    console.log("FocusSession: Component mounted");
    console.log("FocusSession: Initial state:", { 
      isPaused, 
      showEndConfirmation, 
      currentMilestone,
      environment: state.environment
    });
    
    return () => {
      console.log("FocusSession: Component unmounting");
    };
  }, []);

  // Monitor end confirmation dialog state
  useEffect(() => {
    console.log("FocusSession: showEndConfirmation changed to", showEndConfirmation);
  }, [showEndConfirmation]);

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col items-center p-4 overflow-hidden",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <div className="w-full max-w-4xl">
        <FocusSessionHeader 
          lowPowerMode={lowPowerMode}
          toggleLowPowerMode={toggleLowPowerMode}
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
          onEndSessionClick={() => {
            console.log("FocusSession: End session button clicked, showing confirmation dialog");
            setShowEndConfirmation(true);
          }}
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
          console.log("FocusSession: ConfirmEndDialog onOpenChange called with", open);
          setShowEndConfirmation(open);
        }}
        onConfirm={() => {
          console.log("FocusSession: ConfirmEndDialog onConfirm called");
          // Navigation is now handled directly in ConfirmEndDialog
          handleEndSessionConfirm();
        }}
        onCancel={() => {
          console.log("FocusSession: ConfirmEndDialog onCancel called");
          setShowEndConfirmation(false);
        }}
      />
    </div>
  );
};

export default FocusSession;

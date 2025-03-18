
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
import { toast } from "sonner";

const FocusSession = () => {
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const operationInProgressRef = useRef(false);
  
  // Clean up animations when component unmounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
      
      // Cancel any pending animations
      if (window.cancelAnimationFrame) {
        const maxId = 100; // Safety limit
        let id = window.requestAnimationFrame(() => {});
        for (let i = id; i > id - maxId; i--) {
          window.cancelAnimationFrame(i);
        }
      }
    };
  }, []);
  
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
  
  const handleLowPowerModeToggle = () => {
    if (operationInProgressRef.current) return;
    
    operationInProgressRef.current = true;
    
    // Small delay to prevent UI freezing
    setTimeout(() => {
      toggleLowPowerMode();
      toast.info(lowPowerMode ? "Enhanced mode activated" : "Low power mode activated", {
        duration: 2000
      });
      
      // Release the lock after a short delay
      setTimeout(() => {
        operationInProgressRef.current = false;
      }, 300);
    }, 10);
  };
  
  const handleEndSessionClick = () => {
    if (operationInProgressRef.current) return;
    
    operationInProgressRef.current = true;
    
    // Small delay to prevent UI freezing
    setTimeout(() => {
      setShowEndConfirmation(true);
      operationInProgressRef.current = false;
    }, 10);
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
          setShowEndConfirmation(open);
        }}
      />
    </div>
  );
};

export default FocusSession;

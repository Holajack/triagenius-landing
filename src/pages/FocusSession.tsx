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
import FocusSessionWalkthrough from '@/components/walkthrough/FocusSessionWalkthrough';
import { toast } from "sonner";

const FocusSession = () => {
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const operationInProgressRef = useRef(false);
  const operationTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      document.body.style.overflow = 'auto';
      
      if (operationTimeoutRef.current) {
        window.clearTimeout(operationTimeoutRef.current);
      }
      
      if (window.cancelAnimationFrame) {
        const maxId = 100;
        const currentId = window.requestAnimationFrame(() => {});
        for (let i = currentId; i > currentId - maxId; i--) {
          window.cancelAnimationFrame(i);
        }
      }
    };
  }, []);
  
  const {
    isPaused,
    showMotivation,
    currentMilestone,
    isCelebrating,
    lowPowerMode,
    segmentProgress,
    showEndConfirmation,
    
    timerRef,
    
    handlePause,
    handleResume,
    handleSessionEnd,
    handleEndSessionEarly,
    handleEndSessionConfirm,
    handleMilestoneReached,
    handleProgressUpdate,
    toggleLowPowerMode,
    
    setShowMotivation,
    setShowEndConfirmation
  } = useFocusSession();
  
  const handleLowPowerModeToggle = () => {
    if (operationInProgressRef.current || !isMountedRef.current) return;
    
    operationInProgressRef.current = true;
    
    if (operationTimeoutRef.current) {
      window.clearTimeout(operationTimeoutRef.current);
    }
    
    operationTimeoutRef.current = window.setTimeout(() => {
      if (isMountedRef.current) {
        toggleLowPowerMode();
        toast.info(lowPowerMode ? "Enhanced mode activated" : "Low power mode activated", {
          duration: 2000
        });
      }
      
      operationTimeoutRef.current = window.setTimeout(() => {
        operationInProgressRef.current = false;
        operationTimeoutRef.current = null;
      }, 300);
    }, 10);
  };
  
  const handleEndSessionClick = () => {
    if (operationInProgressRef.current || !isMountedRef.current) return;
    
    operationInProgressRef.current = true;
    
    if (operationTimeoutRef.current) {
      window.clearTimeout(operationTimeoutRef.current);
    }
    
    operationTimeoutRef.current = window.setTimeout(() => {
      if (isMountedRef.current) {
        setShowEndConfirmation(true);
      }
      
      operationInProgressRef.current = false;
      operationTimeoutRef.current = null;
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
        onConfirmEnd={handleEndSessionConfirm}
      />
    </div>
  );
};

export default FocusSession;

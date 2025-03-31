import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFocusSession } from "@/hooks/use-focus-session";
import { useTasks } from "@/contexts/TaskContext";
import { MotivationalDialog } from "@/components/focus/MotivationalDialog";
import { ConfirmEndDialog } from "@/components/focus/ConfirmEndDialog";
import FocusSessionHeader from "@/components/focus/FocusSessionHeader";
import FocusSessionContent from "@/components/focus/FocusSessionContent";
import FocusSessionWalkthrough from '@/components/walkthrough/FocusSessionWalkthrough';
import { toast } from "sonner";

const FocusSession = () => {
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const { state: taskState } = useTasks();
  const isMobile = useIsMobile();
  const operationInProgressRef = useRef(false);
  const operationTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskPriorities, setTaskPriorities] = useState<string[]>([]);
  
  useEffect(() => {
    try {
      const savedPriorities = localStorage.getItem('focusTaskPriority');
      if (savedPriorities) {
        setTaskPriorities(JSON.parse(savedPriorities));
      }
    } catch (error) {
      console.error("Error loading task priorities:", error);
    }
  }, []);
  
  const getCurrentTask = () => {
    if (taskPriorities.length === 0 || currentTaskIndex >= taskPriorities.length) {
      return null;
    }
    
    const currentTaskId = taskPriorities[currentTaskIndex];
    return taskState.tasks.find(task => task.id === currentTaskId);
  };
  
  const goToNextTask = () => {
    if (currentTaskIndex < taskPriorities.length - 1) {
      setCurrentTaskIndex(prevIndex => prevIndex + 1);
      const nextTask = taskState.tasks.find(task => task.id === taskPriorities[currentTaskIndex + 1]);
      if (nextTask) {
        toast.info(`Moving to next task: ${nextTask.title}`);
      }
    }
  };
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    isMountedRef.current = true;
    
    const setupBackgroundTimer = () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'START_BACKGROUND_TIMER',
          data: {
            duration: timerRef.current?.getRemainingTime ? timerRef.current.getRemainingTime() : 0,
            timestamp: Date.now()
          }
        });
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setupBackgroundTimer();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMountedRef.current = false;
      document.body.style.overflow = 'auto';
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
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
  
  const handleMilestoneCompletionWithTask = (milestone: number) => {
    handleMilestoneReached(milestone);
    
    if (milestone > 0 && milestone % 2 === 0) {
      goToNextTask();
    }
  };
  
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

  const currentTask = getCurrentTask();

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
          currentTask={currentTask}
        />
        
        <FocusSessionContent 
          timerRef={timerRef}
          onPause={handlePause}
          onResume={handleResume}
          onComplete={handleSessionEnd}
          onMilestoneReached={handleMilestoneCompletionWithTask}
          onProgressUpdate={handleProgressUpdate}
          isPaused={isPaused}
          onEndSessionClick={handleEndSessionClick}
          lowPowerMode={lowPowerMode}
          environment={state.environment}
          currentMilestone={currentMilestone}
          isCelebrating={isCelebrating}
          segmentProgress={segmentProgress}
          currentTask={currentTask}
          totalTasks={taskPriorities.length}
          currentTaskIndex={currentTaskIndex}
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

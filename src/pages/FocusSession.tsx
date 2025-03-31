
import { useState, useEffect, useRef, MutableRefObject } from "react";
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
  
  // Load task priorities from localStorage on mount
  useEffect(() => {
    try {
      const savedPriorities = localStorage.getItem('focusTaskPriority');
      if (savedPriorities) {
        const priorities = JSON.parse(savedPriorities);
        setTaskPriorities(priorities);
        
        // Always start with the first task (index 0)
        setCurrentTaskIndex(0);
        
        // Show toast with first task info if available
        if (priorities.length > 0) {
          const firstTaskId = priorities[0];
          const firstTask = taskState.tasks.find(task => task.id === firstTaskId);
          if (firstTask) {
            const priorityMode = localStorage.getItem('priorityMode');
            if (priorityMode === 'auto') {
              toast.info(`Starting with highest priority task: ${firstTask.title}`);
            } else {
              toast.info(`Starting with your first selected task: ${firstTask.title}`);
            }
          }
        }
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
    
    // No need for visibility change handlers here - moved to focus session hook
    
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
  
  const handleMilestoneCompletionWithTask = (milestone: number) => {
    handleMilestoneReached(milestone);
    
    // Only advance to the next task every other milestone (milestone % 2 === 0)
    // This ensures each task gets enough focus time
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

  const typedTimerRef = timerRef as MutableRefObject<{
    stopTimer: () => void;
    setRemainingTime: (time: number) => void;
    getRemainingTime: () => number;
  } | null>;

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
          timerRef={typedTimerRef}
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


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
  const [currentTaskCompleted, setCurrentTaskCompleted] = useState(false);
  
  // Load task priorities from localStorage on mount
  useEffect(() => {
    try {
      const savedPriorities = localStorage.getItem('focusTaskPriority');
      if (savedPriorities) {
        const priorities = JSON.parse(savedPriorities);
        setTaskPriorities(priorities);
        
        // Retrieve saved task index if it exists
        const savedTaskIndex = localStorage.getItem('currentTaskIndex');
        if (savedTaskIndex) {
          const index = parseInt(savedTaskIndex, 10);
          if (!isNaN(index) && index >= 0 && index < priorities.length) {
            setCurrentTaskIndex(index);
          } else {
            setCurrentTaskIndex(0);
          }
        } else {
          // Always start with the first task (index 0)
          setCurrentTaskIndex(0);
        }
        
        // Show toast with first task info if available
        if (priorities.length > 0) {
          const taskId = priorities[savedTaskIndex ? parseInt(savedTaskIndex, 10) : 0];
          const task = taskState.tasks.find(task => task.id === taskId);
          if (task) {
            const priorityMode = localStorage.getItem('priorityMode');
            if (priorityMode === 'auto') {
              toast.info(`Starting with highest priority task: ${task.title}`);
            } else {
              toast.info(`Starting with your first selected task: ${task.title}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading task priorities:", error);
    }
  }, []);
  
  // Save current task index to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('currentTaskIndex', currentTaskIndex.toString());
    } catch (error) {
      console.error("Error saving current task index:", error);
    }
  }, [currentTaskIndex]);
  
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
      setCurrentTaskCompleted(false);
      
      const nextTask = taskState.tasks.find(task => task.id === taskPriorities[currentTaskIndex + 1]);
      if (nextTask) {
        toast.success(`Task completed! Moving to next task: ${nextTask.title}`);
      }
    } else {
      // All tasks completed
      toast.success("Congratulations! All tasks have been completed.");
    }
  };
  
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
  
  // This function now only tracks milestone progress without automatically advancing tasks
  const handleMilestoneCompletionWithTask = (milestone: number) => {
    handleMilestoneReached(milestone);
    
    // If we reach the final milestone (timer completion), mark the current task as completed
    if (milestone === 3) {
      setCurrentTaskCompleted(true);
      toast.success("Timer completed! Task is now finished.");
    }
  };
  
  // New function to handle timer completion
  const handleTimerComplete = () => {
    setCurrentTaskCompleted(true);
    
    // If there are more tasks, show a prompt to continue to the next task
    if (currentTaskIndex < taskPriorities.length - 1) {
      toast.success("Task completed! Continue to the next task when ready.", {
        action: {
          label: "Next Task",
          onClick: goToNextTask
        },
        duration: 10000
      });
    } else {
      // This was the final task
      toast.success("All tasks completed! Great job!", {
        duration: 5000
      });
      
      // Proceed with session end
      handleSessionEnd();
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
          onComplete={handleTimerComplete}
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
          currentTaskCompleted={currentTaskCompleted}
          onNextTask={goToNextTask}
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

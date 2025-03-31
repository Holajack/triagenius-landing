
import { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StudyEnvironment } from "@/types/onboarding";
import { Pause, Play, StopCircle, CheckCircle2, ListChecks, BookOpen, ArrowRight } from "lucide-react";
import FocusTimer from "./FocusTimer";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/types/tasks";

interface FocusSessionContentProps {
  timerRef: React.MutableRefObject<{ 
    stopTimer: () => void; 
    setRemainingTime: (time: number) => void; 
    getRemainingTime: () => number 
  } | null>;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onMilestoneReached: (milestone: number) => void;
  onProgressUpdate: (progress: number) => void;
  isPaused: boolean;
  onEndSessionClick: () => void;
  lowPowerMode: boolean;
  environment?: StudyEnvironment;
  currentMilestone: number;
  isCelebrating: boolean;
  segmentProgress: number;
  currentTask?: Task | null;
  totalTasks?: number;
  currentTaskIndex?: number;
  currentTaskCompleted?: boolean;
  onNextTask?: () => void;
}

const FocusSessionContent = ({
  timerRef,
  onPause,
  onResume,
  onComplete,
  onMilestoneReached,
  onProgressUpdate,
  isPaused,
  onEndSessionClick,
  lowPowerMode,
  environment = "office",
  currentMilestone,
  isCelebrating,
  segmentProgress,
  currentTask,
  totalTasks = 0,
  currentTaskIndex = 0,
  currentTaskCompleted = false,
  onNextTask
}: FocusSessionContentProps) => {
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);
  const [priorityMode, setPriorityMode] = useState<string | null>(null);
  
  const getTimerDuration = () => {
    try {
      const savedSettings = localStorage.getItem('focusTimerDuration');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return settings.minutes * 60 + (settings.seconds || 0);
      }
    } catch (error) {
      console.error("Error loading timer settings:", error);
    }
    
    return 25 * 60;
  };
  
  const getEnvironmentBg = () => {
    switch (environment) {
      case 'office': return "bg-blue-50";
      case 'park': return "bg-green-50";
      case 'home': return "bg-orange-50";
      case 'coffee-shop': return "bg-amber-50";
      case 'library': return "bg-gray-50";
      default: return "bg-purple-50";
    }
  };
  
  const getButtonGradient = () => {
    switch (environment) {
      case 'office': return "bg-gradient-to-r from-blue-600 to-blue-700";
      case 'park': return "bg-gradient-to-r from-green-700 to-green-800";
      case 'home': return "bg-gradient-to-r from-orange-500 to-orange-600";
      case 'coffee-shop': return "bg-gradient-to-r from-amber-700 to-amber-800";
      case 'library': return "bg-gradient-to-r from-gray-600 to-gray-700";
      default: return "button-gradient";
    }
  };

  const getPriorityMode = () => {
    try {
      const mode = localStorage.getItem('priorityMode');
      return mode;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    setPriorityMode(getPriorityMode());
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.controller?.postMessage({
          type: 'GET_BACKGROUND_TIMER',
        });
      }
    };
    
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data.type === 'BACKGROUND_TIMER_UPDATE') {
        const { remainingTime } = event.data;
        if (timerRef.current?.setRemainingTime && remainingTime) {
          timerRef.current.setRemainingTime(remainingTime);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  return (
    <Card className={cn(
      "w-full transition-all duration-300",
      getEnvironmentBg(),
      isCelebrating ? "scale-105" : ""
    )}>
      <CardContent className={cn("p-3 sm:p-4 md:p-6")} ref={contentRef}>
        <div className="flex flex-col items-center">
          {priorityMode && (
            <div className="w-full mb-1 sm:mb-2">
              <div className={cn(
                "px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium inline-flex items-center",
                priorityMode === 'auto' 
                  ? "bg-blue-100 text-blue-800" 
                  : "bg-purple-100 text-purple-800"
              )}>
                <ListChecks className="w-3 h-3 mr-1" />
                {priorityMode === 'auto' ? 'Auto Priority' : 'Custom Order'}
              </div>
            </div>
          )}
          
          <div className="w-full mb-3 sm:mb-4 flex justify-center">
            <FocusTimer
              ref={timerRef}
              initialTime={getTimerDuration()}
              isPaused={isPaused}
              onComplete={onComplete}
              onMilestoneReached={onMilestoneReached}
              onProgressUpdate={onProgressUpdate}
              lowPowerMode={lowPowerMode}
              className={cn(
                "transition-all duration-300",
                isMobile ? "w-52 h-52 sm:w-64 sm:h-64" : "w-80 h-80"
              )}
            />
          </div>
          
          <div className="mt-1 sm:mt-2 mb-3 sm:mb-4 flex flex-col sm:flex-row gap-2 w-full max-w-md">
            {currentTaskCompleted && currentTaskIndex < (totalTasks - 1) ? (
              <motion.div
                key="next-task"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Button
                  className={cn(
                    "w-full py-2 sm:py-3 h-auto text-white",
                    getButtonGradient()
                  )}
                  onClick={onNextTask}
                >
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  Next Task
                </Button>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {isPaused ? (
                  <motion.div
                    key="resume"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <Button
                      className={cn(
                        "w-full py-2 sm:py-3 h-auto text-white",
                        getButtonGradient()
                      )}
                      onClick={onResume}
                      disabled={currentTaskCompleted}
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      Resume
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="pause"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      className="w-full py-2 sm:py-3 h-auto"
                      onClick={onPause}
                      disabled={currentTaskCompleted}
                    >
                      <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      Pause
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
            
            <Button
              variant={isPaused ? "outline" : "secondary"}
              className="w-full py-2 sm:py-3 h-auto"
              onClick={onEndSessionClick}
            >
              <StopCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              End Session
            </Button>
          </div>
          
          {currentTask && (
            <div className="w-full max-w-md mx-auto mb-3">
              <div className={cn(
                "bg-white/80 rounded-lg p-2 sm:p-3 shadow-sm border-l-4",
                currentTaskCompleted ? "border-green-500" : "border-blue-500"
              )}>
                <h3 className="text-xs sm:text-sm font-medium flex items-center mb-1">
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Current Focus Task
                  {currentTaskCompleted && (
                    <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                      Done
                    </span>
                  )}
                </h3>
                <div className="text-sm sm:text-base font-medium mb-1 line-clamp-2">{currentTask.title}</div>
                <div className="flex justify-between items-center">
                  <div className="text-xs inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                    Priority: <span className="font-medium ml-1 capitalize">{currentTask.priority}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentTaskIndex + 1}/{totalTasks}
                  </div>
                </div>
                {currentTask.subtasks && currentTask.subtasks.length > 0 && (
                  <div className="mt-1 sm:mt-2">
                    <div className="text-xs font-medium text-gray-500">Subtasks:</div>
                    <div className="space-y-0.5 mt-0.5 max-h-12 overflow-y-auto">
                      {currentTask.subtasks.slice(0, 2).map((subtask, idx) => (
                        <div key={subtask.id} className="flex items-center text-xs">
                          <span className="w-3 text-xs text-gray-500 mr-1">{idx + 1}.</span>
                          <span className="truncate">{subtask.title}</span>
                        </div>
                      ))}
                      {currentTask.subtasks.length > 2 && (
                        <div className="text-xs text-gray-500 italic">
                          +{currentTask.subtasks.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {currentMilestone >= 3 && !currentTaskCompleted && (
            <div className="mb-3 text-center">
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-sm py-1.5 h-auto px-3"
                onClick={onComplete}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Complete Task
              </Button>
            </div>
          )}
          
          {totalTasks > 0 && (
            <div className="w-full bg-white/80 rounded-lg p-2 sm:p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs sm:text-sm font-medium flex items-center">
                  <ListChecks className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Task Progress
                </h3>
                <span className="text-xs text-gray-500">
                  {currentTaskIndex + 1} of {totalTasks}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.round(((currentTaskIndex + (currentTaskCompleted ? 1 : 0.5)) / totalTasks) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FocusSessionContent;

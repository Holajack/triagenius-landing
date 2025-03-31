
import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StudyEnvironment } from "@/types/onboarding";
import { Pause, Play, StopCircle, CheckCircle2, ListChecks, BookOpen } from "lucide-react";
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
  currentTaskIndex = 0
}: FocusSessionContentProps) => {
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);
  
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

  useEffect(() => {
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
      <CardContent className="p-6" ref={contentRef}>
        <div className="flex flex-col items-center">
          {/* Timer section - Now larger and at the top */}
          <div className="w-full mb-8 flex justify-center">
            <FocusTimer
              ref={timerRef}
              initialTime={getTimerDuration()}
              isPaused={isPaused}
              onComplete={onComplete}
              onMilestoneReached={onMilestoneReached}
              onProgressUpdate={onProgressUpdate}
              lowPowerMode={lowPowerMode}
              className="w-64 h-64 sm:w-80 sm:h-80"
            />
          </div>
          
          {/* Control buttons - positioned below the timer */}
          <div className="mt-4 mb-8 flex flex-col sm:flex-row gap-4 w-full max-w-md">
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
                      "w-full py-6 h-auto text-white",
                      getButtonGradient()
                    )}
                    onClick={onResume}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Resume Session
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
                    className="w-full py-6 h-auto"
                    onClick={onPause}
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button
              variant={isPaused ? "outline" : "secondary"}
              className="w-full py-6 h-auto"
              onClick={onEndSessionClick}
            >
              <StopCircle className="w-5 h-5 mr-2" />
              End Session
            </Button>
          </div>
          
          {currentMilestone >= 3 && (
            <div className="mb-6 text-center">
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={onComplete}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Complete Session
              </Button>
            </div>
          )}
          
          {/* Task progress section - moved below the timer */}
          {totalTasks > 0 && (
            <div className="w-full mb-4 bg-white/80 rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium flex items-center">
                  <ListChecks className="w-4 h-4 mr-1" />
                  Task Progress
                </h3>
                <span className="text-xs text-gray-500">
                  {currentTaskIndex + 1} of {totalTasks}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.round(((currentTaskIndex + 1) / totalTasks) * 100)}%` }}
                ></div>
              </div>
              
              {currentTask && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">Current: </span>
                  {currentTask.title}
                  {currentTask.subtasks && currentTask.subtasks.length > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({currentTask.subtasks.length} subtasks)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Current task details - moved to the bottom */}
          <div className="w-full max-w-md mx-auto">
            {currentTask ? (
              <div className="bg-white/80 rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium flex items-center mb-2">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Current Focus Task
                </h3>
                <div className="text-base font-medium mb-1">{currentTask.title}</div>
                {currentTask.subtasks && currentTask.subtasks.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">Subtasks:</div>
                    <div className="space-y-1">
                      {currentTask.subtasks.map((subtask, idx) => (
                        <div key={subtask.id} className="flex items-center text-sm">
                          <span className="w-4 text-xs text-gray-500 mr-1">{idx + 1}.</span>
                          {subtask.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 text-xs text-right text-gray-500">
                  Task {currentTaskIndex + 1} of {totalTasks}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-500">
                No specific task selected for this session
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FocusSessionContent;

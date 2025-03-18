
import React, { useRef, useEffect } from "react";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { SimpleLandscapeAnimation } from "@/components/focus/SimpleLandscapeAnimation";
import SessionGoals from "@/components/focus/SessionGoals";
import { StudyEnvironment } from "@/types/onboarding";
import ErrorBoundary from "@/components/ErrorBoundary";

interface FocusSessionContentProps {
  timerRef: React.MutableRefObject<{ stopTimer: () => void } | null>;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onMilestoneReached: (milestone: number) => void;
  onProgressUpdate: (progress: number) => void;
  isPaused: boolean;
  onEndSessionClick: () => void;
  lowPowerMode: boolean;
  environment: string;
  currentMilestone: number;
  isCelebrating: boolean;
  segmentProgress: number;
}

const FocusSessionContent: React.FC<FocusSessionContentProps> = ({
  timerRef,
  onPause,
  onResume,
  onComplete,
  onMilestoneReached,
  onProgressUpdate,
  isPaused,
  onEndSessionClick,
  lowPowerMode,
  environment,
  currentMilestone,
  isCelebrating,
  segmentProgress
}) => {
  const previousLowPowerRef = useRef(lowPowerMode);
  const lastProgressUpdateRef = useRef(Date.now());
  const throttleTimeRef = useRef(lowPowerMode ? 500 : 100);
  const animationFramesRef = useRef<number[]>([]);
  const isMountedRef = useRef(true);
  
  // Set mounted flag and handle cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Cancel all stored animation frames to prevent memory leaks
      animationFramesRef.current.forEach(id => {
        if (id) window.cancelAnimationFrame(id);
      });
      animationFramesRef.current = [];
      
      // Also cancel any other potentially running animations
      if (window.cancelAnimationFrame) {
        const maxId = 100; // Safety limit to prevent infinite loops
        const currentId = window.requestAnimationFrame(() => {});
        for (let i = currentId; i > currentId - maxId; i--) {
          window.cancelAnimationFrame(i);
        }
      }
    };
  }, []);
  
  // Optimize progress updates and handle low power mode changes
  useEffect(() => {
    // Update throttle time based on low power mode
    if (previousLowPowerRef.current !== lowPowerMode) {
      throttleTimeRef.current = lowPowerMode ? 500 : 100;
      previousLowPowerRef.current = lowPowerMode;
    }
  }, [lowPowerMode]);
  
  // Optimized progress handler with throttling
  const handleProgressUpdate = (progress: number) => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    if (now - lastProgressUpdateRef.current >= throttleTimeRef.current) {
      lastProgressUpdateRef.current = now;
      onProgressUpdate(progress);
    }
  };
  
  // Handle end session clicks with proper animation cleanup
  const handleEndClick = () => {
    if (!isMountedRef.current) return;
    
    // Cancel any pending animations that might cause lag
    animationFramesRef.current.forEach(id => {
      if (id) window.cancelAnimationFrame(id);
    });
    animationFramesRef.current = [];
    
    // Also cancel any other potentially running animations
    if (window.cancelAnimationFrame) {
      const maxId = 100; // Safety limit to prevent infinite loops
      const currentId = window.requestAnimationFrame(() => {});
      for (let i = currentId; i > currentId - maxId; i--) {
        window.cancelAnimationFrame(i);
      }
    }
    
    // Introduce a very small delay before navigation to ensure UI is stable
    requestAnimationFrame(() => {
      if (isMountedRef.current) {
        onEndSessionClick();
      }
    });
  };
  
  // Cast the environment string to StudyEnvironment or use a default value if it's not valid
  const validEnvironments: StudyEnvironment[] = ['office', 'park', 'home', 'coffee-shop', 'library'];
  const safeEnvironment: StudyEnvironment = validEnvironments.includes(environment as StudyEnvironment) 
    ? (environment as StudyEnvironment) 
    : 'office'; // Default to 'office' if the environment is not valid

  return (
    <div className="flex flex-col items-center space-y-8 mt-4">
      <FocusTimer
        ref={timerRef}
        onPause={onPause}
        onResume={onResume}
        onComplete={onComplete}
        onMilestoneReached={onMilestoneReached}
        onProgressUpdate={handleProgressUpdate}
        isPaused={isPaused}
        autoStart={true}
        showControls={false}
        onEndSessionClick={handleEndClick}
      />
      
      {/* Wrap SimpleLandscapeAnimation in ErrorBoundary */}
      <div 
        className="relative w-full aspect-[3/1] rounded-lg overflow-hidden shadow-md" 
        aria-hidden={lowPowerMode}
        style={{ display: lowPowerMode ? 'none' : 'block' }} // Force DOM removal for PWA performance
      >
        <ErrorBoundary fallback={
          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Landscape view unavailable</p>
          </div>
        }>
          <SimpleLandscapeAnimation 
            environment={safeEnvironment}
            milestone={currentMilestone}
            isCelebrating={isCelebrating}
            progress={segmentProgress}
          />
        </ErrorBoundary>
      </div>
      
      <SessionGoals />
    </div>
  );
};

export default FocusSessionContent;

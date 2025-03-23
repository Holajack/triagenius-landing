
import React, { useRef, useEffect } from "react";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { HikingTrail } from "@/components/focus/HikingTrail";
import SessionGoals from "@/components/focus/SessionGoals";
import { StudyEnvironment } from "@/types/onboarding";
interface FocusSessionContentProps {
  timerRef: React.MutableRefObject<{
    stopTimer: () => void;
  } | null>;
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
  const safeEnvironment: StudyEnvironment = validEnvironments.includes(environment as StudyEnvironment) ? environment as StudyEnvironment : 'office'; // Default to 'office' if the environment is not valid

  return <div className="flex flex-col items-center space-y-8 mt-4">
      <FocusTimer ref={timerRef} onPause={onPause} onResume={onResume} onComplete={onComplete} onMilestoneReached={onMilestoneReached} onProgressUpdate={handleProgressUpdate} isPaused={isPaused} autoStart={true} showControls={false} onEndSessionClick={handleEndClick} />
      
      {/* Only render the HikingTrail when not in low power mode */}
      {!lowPowerMode && (
        <HikingTrail 
          environment={safeEnvironment} 
          currentMilestone={currentMilestone} 
          isCelebrating={isCelebrating}
          segmentProgress={segmentProgress}
        />
      )}
      
      <SessionGoals />
    </div>;
};
export default FocusSessionContent;

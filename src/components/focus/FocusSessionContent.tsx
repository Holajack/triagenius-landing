
import React, { useRef, useEffect } from "react";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { HikingTrail } from "@/components/focus/HikingTrail";
import SessionGoals from "@/components/focus/SessionGoals";
import { StudyEnvironment } from "@/types/onboarding";

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
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  const previousLowPowerRef = useRef(lowPowerMode);
  
  // Track significant renders and low power mode changes
  useEffect(() => {
    renderCountRef.current++;
    const now = Date.now();
    const elapsed = now - lastRenderTimeRef.current;
    
    // Only log occasional renders to avoid flooding console
    if (elapsed > 100 || renderCountRef.current % 10 === 0) {
      console.log(`FocusSessionContent: Render #${renderCountRef.current} at ${now}, ${elapsed}ms since last render`);
    }
    
    lastRenderTimeRef.current = now;
    
    // Specifically track low power mode changes
    if (previousLowPowerRef.current !== lowPowerMode) {
      console.log(`FocusSessionContent: lowPowerMode changed from ${previousLowPowerRef.current} to ${lowPowerMode} at ${now}`);
      previousLowPowerRef.current = lowPowerMode;
    }
  });
  
  // Track end session button clicks
  const handleEndClick = () => {
    console.log(`FocusSessionContent: End session button clicked at ${Date.now()}`);
    onEndSessionClick();
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
        onProgressUpdate={(progress) => {
          // Occasionally log progress updates
          if (Math.floor(progress * 100) % 10 === 0) {
            console.log(`FocusSessionContent: Progress update ${progress.toFixed(2)} at ${Date.now()}`);
          }
          onProgressUpdate(progress);
        }}
        isPaused={isPaused}
        autoStart={true}
        showControls={false}
        onEndSessionClick={handleEndClick}
      />
      
      {/* Only render the HikingTrail when not in low power mode */}
      {!lowPowerMode && (
        <div 
          className="relative w-full aspect-[3/1] rounded-lg overflow-hidden" 
          aria-hidden={lowPowerMode}
          style={{ display: lowPowerMode ? 'none' : 'block' }} // Force DOM removal for PWA performance
        >
          <HikingTrail 
            environment={safeEnvironment}
            milestone={currentMilestone}
            isCelebrating={isCelebrating}
            progress={segmentProgress}
          />
        </div>
      )}
      
      <SessionGoals />
    </div>
  );
};

export default FocusSessionContent;

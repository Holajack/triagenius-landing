
import React from "react";
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
        onProgressUpdate={onProgressUpdate}
        isPaused={isPaused}
        autoStart={true}
        showControls={false}
        onEndSessionClick={onEndSessionClick}
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

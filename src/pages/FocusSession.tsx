
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { HikingTrail } from "@/components/focus/HikingTrail";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { SessionGoals } from "@/components/focus/SessionGoals";
import { MotivationalDialog } from "@/components/focus/MotivationalDialog";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/common/PageHeader";

const FocusSession = () => {
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const [isPaused, setIsPaused] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  
  const handlePause = () => {
    setIsPaused(true);
    setShowMotivation(true);
  };
  
  const handleResume = () => {
    setIsPaused(false);
    setShowMotivation(false);
  };
  
  const handleSessionEnd = () => {
    navigate("/session-report");
  };

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col items-center p-4",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <div className="w-full max-w-4xl">
        <PageHeader title="Focus Session" subtitle="Stay focused and achieve your goals" />
        
        <div className="flex flex-col items-center space-y-8 mt-4">
          <FocusTimer
            onPause={handlePause}
            onResume={handleResume}
            onComplete={handleSessionEnd}
            isPaused={isPaused}
            autoStart={true}
            showControls={false}
          />
          
          <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden">
            <HikingTrail environment={state.environment} />
          </div>
          
          <SessionGoals />
        </div>
      </div>

      <MotivationalDialog
        open={showMotivation}
        onClose={() => setShowMotivation(false)}
      />
    </div>
  );
};

export default FocusSession;


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { HikingTrail } from "@/components/focus/HikingTrail";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { SessionGoals } from "@/components/focus/SessionGoals";
import { MotivationalDialog } from "@/components/focus/MotivationalDialog";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";

const FocusSession = () => {
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const { theme, setTheme } = useTheme();
  const [isPaused, setIsPaused] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(0);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  
  const handlePause = () => {
    setIsPaused(true);
    setShowMotivation(true);
  };
  
  const handleResume = () => {
    setIsPaused(false);
    setShowMotivation(false);
  };
  
  const handleSessionEnd = () => {
    // Save session data to localStorage for the report page
    localStorage.setItem('sessionData', JSON.stringify({
      milestone: currentMilestone,
      duration: currentMilestone * 45, // Minutes based on milestone
      timestamp: new Date().toISOString(),
      environment: state.environment,
    }));
    
    navigate("/session-report");
  };
  
  const handleMilestoneReached = (milestone: number) => {
    setCurrentMilestone(milestone);
    setIsCelebrating(true);
    
    // Reset celebrating state after animation plays
    setTimeout(() => {
      setIsCelebrating(false);
    }, 3000);
  };
  
  const togglePowerMode = () => {
    setLowPowerMode(!lowPowerMode);
    toast.success(`${!lowPowerMode ? "Low power mode" : "Standard mode"} activated`);
  };

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col items-center p-4",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center">
          <PageHeader title="Focus Session" subtitle="Stay focused and achieve your goals" />
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={togglePowerMode}
              title={lowPowerMode ? "Enable animations" : "Disable animations (low-power mode)"}
            >
              {lowPowerMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col items-center space-y-8 mt-4">
          <FocusTimer
            onPause={handlePause}
            onResume={handleResume}
            onComplete={handleSessionEnd}
            onMilestoneReached={handleMilestoneReached}
            isPaused={isPaused}
            autoStart={true}
            showControls={false}
          />
          
          {!lowPowerMode && (
            <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden">
              <HikingTrail 
                environment={state.environment} 
                milestone={currentMilestone}
                isCelebrating={isCelebrating}
              />
            </div>
          )}
          
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


import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { TaskProvider } from "@/contexts/TaskContext";
import { HikingTrail } from "@/components/focus/HikingTrail";
import { FocusTimer } from "@/components/focus/FocusTimer";
import SessionGoals from "@/components/focus/SessionGoals";
import { MotivationalDialog } from "@/components/focus/MotivationalDialog";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Battery, BatteryLow } from "lucide-react";
import { ConfirmEndDialog } from "@/components/focus/ConfirmEndDialog";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";

const FocusSession = () => {
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const { user } = useUser();
  const [isPaused, setIsPaused] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(0);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [segmentProgress, setSegmentProgress] = useState(0); // Progress within the current segment (0-100)
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const timerRef = useRef<{ stopTimer: () => void } | null>(null);
  const isPwaRef = useRef(localStorage.getItem('isPWA') === 'true');
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  const handlePause = () => {
    setIsPaused(true);
    setShowMotivation(true);
  };
  
  const handleResume = () => {
    setIsPaused(false);
    setShowMotivation(false);
  };
  
  // Save session data to local storage and Supabase if user is logged in
  const saveSessionData = (endingEarly = false) => {
    // Create session data object
    const sessionData = {
      milestone: currentMilestone,
      duration: currentMilestone * 45, // Minutes based on milestone
      timestamp: new Date().toISOString(),
      environment: state.environment,
    };
    
    // Always save to localStorage as backup
    localStorage.setItem('sessionData', JSON.stringify(sessionData));
    
    // If user is logged in, save to Supabase (without awaiting to prevent freezing)
    if (user && user.id) {
      // Use setTimeout to move this operation to the next event loop
      setTimeout(async () => {
        try {
          await supabase.from('focus_sessions').insert({
            user_id: user.id,
            duration: sessionData.duration,
            milestone_count: sessionData.milestone,
            environment: sessionData.environment,
            end_time: new Date().toISOString(),
            completed: !endingEarly
          });
          console.log("Session data saved to Supabase");
        } catch (error) {
          console.error("Error saving session:", error);
          // Still continue with local navigation even if saving fails
        }
      }, 0);
    }
  };
  
  const handleSessionEnd = () => {
    // Save session data without marking as ending early
    saveSessionData(false);
    
    // Navigate to the session reflection page
    setTimeout(() => {
      navigate("/session-reflection");
    }, 100);
  };

  const handleEndSessionEarly = () => {
    // Prevent multiple execution
    if (isEnding) return;
    setIsEnding(true);
    
    // Save session data and mark as ending early
    saveSessionData(true);
    
    // Add a small delay to navigate after data is saved
    setTimeout(() => {
      // Generate a unique ID for the session report
      const reportId = `session_${Date.now()}`;
      const reportKey = `sessionReport_${reportId}`;
      
      // Get the saved session data
      const sessionDataStr = localStorage.getItem('sessionData');
      if (sessionDataStr) {
        try {
          const sessionData = JSON.parse(sessionDataStr);
          
          // Save the report with the unique ID
          const reportData = {
            ...sessionData,
            notes: "",
            savedAt: new Date().toISOString()
          };
          localStorage.setItem(reportKey, JSON.stringify(reportData));
        } catch (e) {
          console.error("Error preparing session report:", e);
        }
      }
      
      // For PWA: Use requestAnimationFrame before navigation to prevent jank
      if (isPwaRef.current) {
        requestAnimationFrame(() => {
          navigate(`/session-report/${reportId}`);
          setIsEnding(false);
        });
      } else {
        navigate(`/session-report/${reportId}`);
        setIsEnding(false);
      }
    }, 200);
  };

  const handleEndSessionConfirm = () => {
    // Stop the timer when user confirms ending the session
    if (timerRef.current) {
      timerRef.current.stopTimer();
    }
    
    setShowEndConfirmation(false);
    // Use requestAnimationFrame to prevent UI freezing
    requestAnimationFrame(() => {
      handleEndSessionEarly();
    });
  };
  
  const handleMilestoneReached = (milestone: number) => {
    setCurrentMilestone(milestone);
    setIsCelebrating(true);
    setSegmentProgress(0); // Reset segment progress when milestone is reached
    
    setTimeout(() => {
      setIsCelebrating(false);
    }, 3000);
  };
  
  const handleProgressUpdate = (progress: number) => {
    const easedProgress = Math.pow(progress / 100, 0.85) * 100;
    setSegmentProgress(easedProgress);
  };
  
  // Optimized low power mode toggle to prevent freezing in PWA
  const toggleLowPowerMode = () => {
    // Debounce the toggle for PWA
    if (isPwaRef.current) {
      const newMode = !lowPowerMode;
      
      // Use requestIdleCallback if available, otherwise use requestAnimationFrame
      if ('requestIdleCallback' in window) {
        // @ts-ignore - TypeScript might not recognize requestIdleCallback
        window.requestIdleCallback(() => {
          setLowPowerMode(newMode);
          setTimeout(() => {
            toast.info(newMode ? 
              "Low power mode activated - reduced animations" : 
              "Enhanced visual mode activated",
              { duration: 3000 }
            );
          }, 10);
        });
      } else {
        requestAnimationFrame(() => {
          setTimeout(() => {
            setLowPowerMode(newMode);
            toast.info(newMode ? 
              "Low power mode activated - reduced animations" : 
              "Enhanced visual mode activated",
              { duration: 3000 }
            );
          }, 10);
        });
      }
    } else {
      // Regular behavior for non-PWA
      setLowPowerMode(!lowPowerMode);
      toast.info(!lowPowerMode ? 
        "Low power mode activated - reduced animations" : 
        "Enhanced visual mode activated",
        { duration: 3000 }
      );
    }
  };

  return (
    <TaskProvider>
      <div className={cn(
        "min-h-screen bg-background text-foreground flex flex-col items-center p-4 overflow-hidden",
        `theme-${state.environment || 'default'} ${theme}`
      )}>
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center">
            <PageHeader title="Focus Session" subtitle="Stay focused and achieve your goals" />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleLowPowerMode}
              title={lowPowerMode ? "Switch to enhanced mode" : "Switch to low power mode"}
            >
              {lowPowerMode ? <Battery className="h-5 w-5" /> : <BatteryLow className="h-5 w-5" />}
            </Button>
          </div>
          
          <div className="flex flex-col items-center space-y-8 mt-4">
            <FocusTimer
              ref={timerRef}
              onPause={handlePause}
              onResume={handleResume}
              onComplete={handleSessionEnd}
              onMilestoneReached={handleMilestoneReached}
              onProgressUpdate={handleProgressUpdate}
              isPaused={isPaused}
              autoStart={true}
              showControls={false}
              onEndSessionClick={() => setShowEndConfirmation(true)}
            />
            
            {!lowPowerMode && (
              <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden">
                <HikingTrail 
                  environment={state.environment} 
                  milestone={currentMilestone}
                  isCelebrating={isCelebrating}
                  progress={segmentProgress}
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

        <ConfirmEndDialog
          open={showEndConfirmation}
          onOpenChange={setShowEndConfirmation}
          onConfirm={handleEndSessionConfirm}
          onCancel={() => setShowEndConfirmation(false)}
        />
      </div>
    </TaskProvider>
  );
};

export default FocusSession;

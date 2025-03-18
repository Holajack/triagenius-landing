import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";
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
  const [segmentProgress, setSegmentProgress] = useState(0);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const isEndingRef = useRef(false);
  const timerRef = useRef<{ stopTimer: () => void } | null>(null);
  const isPwaRef = useRef(localStorage.getItem('isPWA') === 'true');
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    if (isPwaRef.current && window.Worker) {
      try {
        const workerCode = `
          self.onmessage = function(e) {
            const { type, data } = e.data;
            
            if (type === 'saveSession') {
              self.postMessage({ type: 'sessionSaved', success: true });
            }
          };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        workerRef.current = new Worker(workerUrl);
        
        workerRef.current.onmessage = (e) => {
          if (e.data.type === 'sessionSaved') {
            console.log('Worker completed session saving');
          }
        };
      } catch (error) {
        console.error('Worker initialization failed:', error);
      }
    }
    
    return () => {
      document.body.style.overflow = 'auto';
      
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
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
  
  const saveSessionData = (endingEarly = false) => {
    const sessionData = {
      milestone: currentMilestone,
      duration: currentMilestone * 45,
      timestamp: new Date().toISOString(),
      environment: state.environment,
    };
    
    try {
      localStorage.setItem('sessionData', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
    
    if (user && user.id) {
      if (workerRef.current && isPwaRef.current) {
        workerRef.current.postMessage({
          type: 'saveSession',
          data: { sessionData, userId: user.id, endingEarly }
        });
      } else {
        setTimeout(async () => {
          try {
            supabase.from('focus_sessions').insert({
              user_id: user.id,
              duration: sessionData.duration,
              milestone_count: sessionData.milestone,
              environment: sessionData.environment,
              end_time: new Date().toISOString(),
              completed: !endingEarly
            }).then(() => {
              console.log("Session data saved to Supabase");
            });
          } catch (error) {
            console.error("Error saving session:", error);
          }
        }, 10);
      }
    }
  };
  
  const handleSessionEnd = () => {
    saveSessionData(false);
    requestAnimationFrame(() => {
      setTimeout(() => {
        navigate("/session-reflection");
      }, 50);
    });
  };

  const handleEndSessionEarly = () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    
    saveSessionData(true);
    
    const reportId = `session_${Date.now()}`;
    const reportKey = `sessionReport_${reportId}`;
    
    try {
      const sessionDataStr = localStorage.getItem('sessionData');
      if (sessionDataStr) {
        const sessionData = JSON.parse(sessionDataStr);
        
        const reportData = {
          ...sessionData,
          notes: "",
          savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(reportKey, JSON.stringify(reportData));
      }
    } catch (e) {
      console.error("Error preparing session report:", e);
    }
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        navigate(`/session-report/${reportId}`);
        isEndingRef.current = false;
      }, 50);
    });
  };

  const handleEndSessionConfirm = () => {
    if (timerRef.current) {
      timerRef.current.stopTimer();
    }
    
    setShowEndConfirmation(false);
    
    requestAnimationFrame(() => {
      handleEndSessionEarly();
    });
  };
  
  const handleMilestoneReached = (milestone: number) => {
    setCurrentMilestone(milestone);
    setIsCelebrating(true);
    setSegmentProgress(0);
    
    setTimeout(() => {
      setIsCelebrating(false);
    }, 3000);
  };
  
  const handleProgressUpdate = (progress: number) => {
    requestAnimationFrame(() => {
      const easedProgress = Math.pow(progress / 100, 0.85) * 100;
      setSegmentProgress(easedProgress);
    });
  };
  
  const toggleLowPowerMode = () => {
    if (isPwaRef.current) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          setLowPowerMode(!lowPowerMode);
          
          setTimeout(() => {
            toast.info(!lowPowerMode ? 
              "Low power mode activated - reduced animations" : 
              "Enhanced visual mode activated",
              { duration: 3000 }
            );
          }, 50);
        }, 10);
      });
    } else {
      setLowPowerMode(!lowPowerMode);
      toast.info(!lowPowerMode ? 
        "Low power mode activated - reduced animations" : 
        "Enhanced visual mode activated",
        { duration: 3000 }
      );
    }
  };

  return (
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
  );
};

export default FocusSession;

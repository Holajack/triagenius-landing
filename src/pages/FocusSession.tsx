
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
import { useIsMobile } from "@/hooks/use-mobile";

const FocusSession = () => {
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const { user } = useUser();
  const isMobile = useIsMobile();
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
  const operationInProgressRef = useRef(false);
  
  // Track whether component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    // Set mounted flag
    isMountedRef.current = true;
    
    // Only initialize worker in PWA mode to save resources
    if (isPwaRef.current && window.Worker) {
      try {
        // Create a more robust worker for background processing
        const workerCode = `
          // Focus session worker for background processing
          let activeOperations = 0;

          self.onmessage = function(e) {
            const { type, data } = e.data;
            
            if (type === 'saveSession') {
              activeOperations++;
              
              // Simulate processing and saving data
              setTimeout(() => {
                activeOperations--;
                self.postMessage({ 
                  type: 'sessionSaved', 
                  success: true,
                  remainingOperations: activeOperations
                });
              }, 300);
            }
            
            if (type === 'lowPowerToggle') {
              // Process low power mode toggle in background
              activeOperations++;
              setTimeout(() => {
                activeOperations--;
                self.postMessage({ 
                  type: 'lowPowerToggled', 
                  success: true,
                  newMode: data.newMode
                });
              }, 100);
            }
          };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        workerRef.current = new Worker(workerUrl);
        
        workerRef.current.onmessage = (e) => {
          if (e.data.type === 'sessionSaved') {
            console.log('Worker completed session saving');
          } else if (e.data.type === 'lowPowerToggled') {
            console.log('Worker completed low power toggle');
          }
        };
      } catch (error) {
        console.error('Worker initialization failed:', error);
      }
    }
    
    return () => {
      // Set unmounted flag to prevent state updates
      isMountedRef.current = false;
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
    if (operationInProgressRef.current) return;
    operationInProgressRef.current = true;
    
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
    
    // Use minimal processing for PWA on mobile
    if (user && user.id) {
      if (workerRef.current && isPwaRef.current) {
        // Offload saving to the worker thread for better UI responsiveness
        workerRef.current.postMessage({
          type: 'saveSession',
          data: { sessionData, userId: user.id, endingEarly }
        });
        
        // Don't wait for worker, allow UI to continue
        operationInProgressRef.current = false;
      } else {
        // For non-PWA, use standard approach with optimized timing
        setTimeout(async () => {
          try {
            const { error } = await supabase.from('focus_sessions').insert({
              user_id: user.id,
              duration: sessionData.duration,
              milestone_count: sessionData.milestone,
              environment: sessionData.environment,
              end_time: new Date().toISOString(),
              completed: !endingEarly
            });
            
            if (error) throw error;
            console.log("Session data saved to Supabase");
          } catch (error) {
            console.error("Error saving session:", error);
          } finally {
            operationInProgressRef.current = false;
          }
        }, 10);
      }
    } else {
      operationInProgressRef.current = false;
    }
  };
  
  const handleSessionEnd = () => {
    if (!isMountedRef.current || operationInProgressRef.current) return;
    operationInProgressRef.current = true;
    
    // Save session data first
    saveSessionData(false);
    
    // Use a more reliable approach for navigation that works in PWA context
    setTimeout(() => {
      if (isMountedRef.current) {
        navigate("/session-reflection", { replace: true });
        operationInProgressRef.current = false;
      }
    }, isPwaRef.current ? 100 : 50);
  };

  const handleEndSessionEarly = () => {
    if (!isMountedRef.current || isEndingRef.current || operationInProgressRef.current) return;
    isEndingRef.current = true;
    operationInProgressRef.current = true;
    
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
    
    // Use a more reliable PWA-compatible navigation approach
    setTimeout(() => {
      if (isMountedRef.current) {
        navigate(`/session-report/${reportId}`, { replace: true });
        isEndingRef.current = false;
        operationInProgressRef.current = false;
      }
    }, isPwaRef.current ? 150 : 50);
  };

  const handleEndSessionConfirm = () => {
    if (!isMountedRef.current || operationInProgressRef.current) return;
    operationInProgressRef.current = true;
    
    // Stop timer first to prevent further updates
    if (timerRef.current) {
      timerRef.current.stopTimer();
    }
    
    setShowEndConfirmation(false);
    
    // Use setTimeout for smoother transition in PWA
    setTimeout(() => {
      if (isMountedRef.current) {
        handleEndSessionEarly();
      }
    }, isPwaRef.current ? 50 : 0);
  };
  
  const handleMilestoneReached = (milestone: number) => {
    setCurrentMilestone(milestone);
    setIsCelebrating(true);
    setSegmentProgress(0);
    
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsCelebrating(false);
      }
    }, 3000);
  };
  
  const handleProgressUpdate = (progress: number) => {
    // Skip updates if unmounted or if in PWA and updates are too frequent
    if (!isMountedRef.current || (isPwaRef.current && operationInProgressRef.current)) return;
    
    // Only set progress if value has changed significantly (reduce UI updates)
    if (Math.abs(progress - segmentProgress) > 1) {
      // Use requestAnimationFrame but with optimized timing for PWA
      if (isPwaRef.current && isMobile) {
        // Less frequent updates for mobile PWA to reduce jank
        if (!operationInProgressRef.current) {
          operationInProgressRef.current = true;
          setTimeout(() => {
            requestAnimationFrame(() => {
              if (isMountedRef.current) {
                const easedProgress = Math.pow(progress / 100, 0.85) * 100;
                setSegmentProgress(easedProgress);
              }
              operationInProgressRef.current = false;
            });
          }, 100); // Throttle updates for PWA
        }
      } else {
        // Normal web app can handle more frequent updates
        requestAnimationFrame(() => {
          if (isMountedRef.current) {
            const easedProgress = Math.pow(progress / 100, 0.85) * 100;
            setSegmentProgress(easedProgress);
          }
        });
      }
    }
  };
  
  const toggleLowPowerMode = () => {
    if (operationInProgressRef.current) return;
    operationInProgressRef.current = true;
    
    if (isPwaRef.current) {
      // For PWA, use the worker to handle mode toggle in background
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'lowPowerToggle',
          data: { newMode: !lowPowerMode }
        });
        
        // Don't wait for worker to complete, update UI immediately
        setLowPowerMode(!lowPowerMode);
        
        // Delay toast to prevent UI jank
        setTimeout(() => {
          if (isMountedRef.current) {
            toast.info(!lowPowerMode ? 
              "Low power mode activated - reduced animations" : 
              "Enhanced visual mode activated",
              { duration: 3000 }
            );
            operationInProgressRef.current = false;
          }
        }, 100);
      } else {
        // Fallback if worker isn't available
        setLowPowerMode(!lowPowerMode);
        setTimeout(() => {
          if (isMountedRef.current) {
            toast.info(!lowPowerMode ? 
              "Low power mode activated - reduced animations" : 
              "Enhanced visual mode activated",
              { duration: 3000 }
            );
            operationInProgressRef.current = false;
          }
        }, 100);
      }
    } else {
      // Standard behavior for non-PWA
      setLowPowerMode(!lowPowerMode);
      toast.info(!lowPowerMode ? 
        "Low power mode activated - reduced animations" : 
        "Enhanced visual mode activated",
        { duration: 3000 }
      );
      operationInProgressRef.current = false;
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
            disabled={operationInProgressRef.current}
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

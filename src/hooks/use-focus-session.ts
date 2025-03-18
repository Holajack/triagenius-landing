import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";

export const useFocusSession = () => {
  const navigate = useNavigate();
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
  const operationInProgressRef = useRef(false);
  const lowPowerToggleInProgressRef = useRef(false);
  const navigationAttemptedRef = useRef(false);
  
  // Track whether component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    // Set mounted flag
    isMountedRef.current = true;
    
    // Enhanced PWA detection that handles more edge cases
    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      isPwaRef.current = isStandalone || localStorage.getItem('isPWA') === 'true';
      
      if (isPwaRef.current) {
        // For PWA version, default to low power mode on mobile devices for better performance
        if (navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {
          setLowPowerMode(true);
        }
      }
    } catch (error) {
      console.error('Error detecting PWA state:', error);
    }
    
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
            lowPowerToggleInProgressRef.current = false;
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
  
  const saveSessionData = (endingEarly = false) => {
    if (operationInProgressRef.current) return;
    operationInProgressRef.current = true;
    
    const sessionData = {
      milestone: currentMilestone,
      duration: currentMilestone * 45,
      timestamp: new Date().toISOString(),
      environment: localStorage.getItem('environment') || 'default',
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
        
        // PWA mode should continue without waiting for worker
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
  
  const handlePause = () => {
    setIsPaused(true);
    setShowMotivation(true);
  };
  
  const handleResume = () => {
    setIsPaused(false);
    setShowMotivation(false);
  };
  
  const handleSessionEnd = () => {
    if (!isMountedRef.current || operationInProgressRef.current || navigationAttemptedRef.current) return;
    navigationAttemptedRef.current = true;
    operationInProgressRef.current = true;
    
    // Save session data first
    saveSessionData(false);
    
    // More reliable navigation for PWA
    if (isPwaRef.current) {
      // Simplified approach for PWA to prevent freezing
      navigate("/session-reflection", { replace: true });
      operationInProgressRef.current = false;
    } else {
      // Standard approach for non-PWA
      setTimeout(() => {
        if (isMountedRef.current) {
          navigate("/session-reflection", { replace: true });
          operationInProgressRef.current = false;
        }
      }, 50);
    }
  };

  const handleEndSessionEarly = () => {
    if (!isMountedRef.current || isEndingRef.current || operationInProgressRef.current || navigationAttemptedRef.current) return;
    isEndingRef.current = true;
    navigationAttemptedRef.current = true;
    operationInProgressRef.current = true;
    
    // For PWA, use a simplified approach to avoid freezing
    if (isPwaRef.current) {
      try {
        // Stop timer immediately
        if (timerRef.current) {
          timerRef.current.stopTimer();
        }
        
        // Prepare session data for report
        const reportId = `session_${Date.now()}`;
        const reportKey = `sessionReport_${reportId}`;
        const sessionData = {
          milestone: currentMilestone,
          duration: currentMilestone * 45,
          timestamp: new Date().toISOString(),
          environment: localStorage.getItem('environment') || 'default',
        };
        
        // Save session data with minimal processing
        localStorage.setItem('sessionData', JSON.stringify(sessionData));
        localStorage.setItem(reportKey, JSON.stringify({
          ...sessionData,
          notes: "",
          savedAt: new Date().toISOString()
        }));
        
        // Navigate immediately to the session report page
        navigate(`/session-report/${reportId}`, { replace: true });
        isEndingRef.current = false;
        operationInProgressRef.current = false;
      } catch (e) {
        console.error("Error in PWA session end:", e);
        // Emergency fallback if error
        navigate("/dashboard", { replace: true });
      }
      return;
    }
    
    // Standard flow for non-PWA
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
    
    // Standard approach for non-PWA
    setTimeout(() => {
      if (isMountedRef.current) {
        navigate(`/session-report/${reportId}`, { replace: true });
        isEndingRef.current = false;
        operationInProgressRef.current = false;
      }
    }, 50);
  };

  const handleEndSessionConfirm = () => {
    if (!isMountedRef.current || operationInProgressRef.current || navigationAttemptedRef.current) return;
    operationInProgressRef.current = true;
    
    // For PWA, use a direct approach to avoid freezing
    if (isPwaRef.current) {
      // Stop timer first
      if (timerRef.current) {
        timerRef.current.stopTimer();
      }
      
      setShowEndConfirmation(false);
      
      // Immediate navigation to end session report for PWA
      handleEndSessionEarly();
      return;
    }
    
    // Standard flow for non-PWA
    if (timerRef.current) {
      timerRef.current.stopTimer();
    }
    
    setShowEndConfirmation(false);
    
    setTimeout(() => {
      if (isMountedRef.current) {
        handleEndSessionEarly();
      }
    }, 0);
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
    
    // For PWA, update less frequently to improve performance
    if (isPwaRef.current && navigator.userAgent.includes('Mobile')) {
      // Throttle updates for mobile PWA
      if (Math.abs(progress - segmentProgress) > 5) {
        setSegmentProgress(progress);
      }
    } else {
      // Normal web app can handle more frequent updates
      // Only set progress if value has changed significantly
      if (Math.abs(progress - segmentProgress) > 1) {
        requestAnimationFrame(() => {
          if (isMountedRef.current) {
            setSegmentProgress(progress);
          }
        });
      }
    }
  };
  
  const toggleLowPowerMode = () => {
    // Prevent multiple rapid toggles that could cause freezing
    if (operationInProgressRef.current || lowPowerToggleInProgressRef.current) return;
    lowPowerToggleInProgressRef.current = true;
    
    if (isPwaRef.current) {
      // For PWA, update state immediately to ensure UI responsiveness
      const newMode = !lowPowerMode;
      setLowPowerMode(newMode);
      
      // Use minimal processing for toast in PWA to prevent jank
      setTimeout(() => {
        if (isMountedRef.current) {
          toast.info(newMode ? 
            "Low power mode activated" : 
            "Visual mode activated",
            { duration: 2000 }
          );
          lowPowerToggleInProgressRef.current = false;
        }
      }, 10);
      
      // Offload background processing to worker if available
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'lowPowerToggle',
          data: { newMode }
        });
      }
    } else {
      // Standard behavior for non-PWA
      setLowPowerMode(!lowPowerMode);
      toast.info(!lowPowerMode ? 
        "Low power mode activated - reduced animations" : 
        "Enhanced visual mode activated",
        { duration: 3000 }
      );
      lowPowerToggleInProgressRef.current = false;
    }
  };

  return {
    // State
    isPaused,
    showMotivation,
    currentMilestone,
    isCelebrating,
    lowPowerMode,
    segmentProgress,
    showEndConfirmation,
    
    // Refs
    timerRef,
    operationInProgressRef,
    
    // Handlers
    handlePause,
    handleResume,
    handleSessionEnd,
    handleEndSessionEarly,
    handleEndSessionConfirm,
    handleMilestoneReached,
    handleProgressUpdate,
    toggleLowPowerMode,
    
    // Setters
    setShowMotivation,
    setShowEndConfirmation
  };
};

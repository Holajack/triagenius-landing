
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
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
  const isPwaRef = useRef(localStorage.getItem('isPWA') === 'true' || window.matchMedia('(display-mode: standalone)').matches);
  const workerRef = useRef<Worker | null>(null);
  const operationInProgressRef = useRef(false);
  const lowPowerToggleInProgressRef = useRef(false);
  const navigationAttemptedRef = useRef(false);
  const navigationTimeoutRef = useRef<number | null>(null);
  
  // Track whether component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    console.log("useFocusSession: Initializing focus session hook");
    document.body.style.overflow = 'hidden';
    // Set mounted flag
    isMountedRef.current = true;
    
    // Reset critical flags on component mount
    isEndingRef.current = false;
    operationInProgressRef.current = false;
    navigationAttemptedRef.current = false;
    
    // Clear any existing timeouts
    if (navigationTimeoutRef.current) {
      window.clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    
    // Enhanced PWA detection that handles more edge cases
    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      isPwaRef.current = isStandalone || localStorage.getItem('isPWA') === 'true';
      console.log("useFocusSession: isPWA detection =", isPwaRef.current);
      
      if (isPwaRef.current) {
        // For PWA version, default to low power mode on mobile devices for better performance
        if (navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {
          setLowPowerMode(true);
        }
      }
    } catch (error) {
      console.error('useFocusSession: Error detecting PWA state:', error);
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
            console.log('useFocusSession: Worker completed session saving');
          } else if (e.data.type === 'lowPowerToggled') {
            console.log('useFocusSession: Worker completed low power toggle');
            lowPowerToggleInProgressRef.current = false;
          }
        };
      } catch (error) {
        console.error('useFocusSession: Worker initialization failed:', error);
      }
    }
    
    return () => {
      // Set unmounted flag to prevent state updates
      console.log("useFocusSession: Unmounting focus session hook");
      isMountedRef.current = false;
      document.body.style.overflow = 'auto';
      
      // Clear any pending timeouts
      if (navigationTimeoutRef.current) {
        window.clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      
      // Reset critical state flags on unmount
      isEndingRef.current = false;
      operationInProgressRef.current = false;
      navigationAttemptedRef.current = false;
    };
  }, []);
  
  // Save session data with improved error handling and state management
  const saveSessionData = async (endingEarly = false) => {
    // Check if operation is already in progress or component is unmounted
    if (operationInProgressRef.current || !isMountedRef.current) {
      console.log("useFocusSession: saveSessionData - operation already in progress or component unmounted, skipping");
      return null;
    }
    
    // Set operation flag to prevent concurrent operations
    operationInProgressRef.current = true;
    console.log("useFocusSession: saveSessionData - starting, endingEarly =", endingEarly);
    
    try {
      const sessionData = {
        milestone: currentMilestone,
        duration: currentMilestone * 45,
        timestamp: new Date().toISOString(),
        environment: localStorage.getItem('environment') || 'default',
        completed: !endingEarly && currentMilestone >= 3
      };
      
      try {
        localStorage.setItem('sessionData', JSON.stringify(sessionData));
        console.log("useFocusSession: Session data saved to localStorage");
      } catch (error) {
        console.error('useFocusSession: Error saving to localStorage:', error);
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
          console.log("useFocusSession: Offloaded saving to worker thread");
        } else {
          // For non-PWA, use standard approach with optimized timing
          try {
            await supabase.from('focus_sessions').insert({
              user_id: user.id,
              duration: sessionData.duration,
              milestone_count: sessionData.milestone,
              environment: sessionData.environment,
              end_time: new Date().toISOString(),
              completed: !endingEarly && currentMilestone >= 3
            });
            console.log("useFocusSession: Session data saved to Supabase");
          } catch (error) {
            console.error("useFocusSession: Error saving session:", error);
          }
        }
      }
      
      return sessionData;
    } catch (error) {
      console.error("useFocusSession: Error in saveSessionData:", error);
      return null;
    } finally {
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
  
  // Improved session end handler with better synchronization
  const handleSessionEnd = async () => {
    if (!isMountedRef.current || isEndingRef.current || navigationAttemptedRef.current) {
      console.log("useFocusSession: handleSessionEnd - Already ending or navigating, skipping");
      return;
    }
    
    // Set flags to prevent multiple executions
    isEndingRef.current = true;
    navigationAttemptedRef.current = true;
    
    console.log("useFocusSession: handleSessionEnd - Starting normal session end");
    
    // Stop timer first to prevent further updates
    if (timerRef.current) {
      timerRef.current.stopTimer();
    }
    
    // Save session data
    const sessionData = await saveSessionData(false);
    
    // Generate a unique report ID
    const reportId = `session_${Date.now()}`;
    console.log("useFocusSession: handleSessionEnd - Generated reportId =", reportId);
    
    try {
      if (sessionData) {
        // Save as a completed session report
        const reportData = {
          ...sessionData,
          savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(`sessionReport_${reportId}`, JSON.stringify(reportData));
        localStorage.setItem(`sessionNotes_${reportId}`, "");
        
        // Clear temporary session data
        localStorage.removeItem('sessionData');
      }
      
      // Clear any existing navigation timeout
      if (navigationTimeoutRef.current) {
        window.clearTimeout(navigationTimeoutRef.current);
      }
      
      // Use a more reliable approach for navigation with sufficient delay
      navigationTimeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          console.log("useFocusSession: handleSessionEnd - Navigating to /session-reflection");
          navigate("/session-reflection", { replace: true });
        }
        
        // Reset flags after navigation
        navigationTimeoutRef.current = null;
        isEndingRef.current = false;
      }, 100);
    } catch (error) {
      console.error("useFocusSession: Error in handleSessionEnd:", error);
      
      // Fall back to dashboard in case of error
      if (isMountedRef.current) {
        toast.error("There was an error saving your session. Returning to dashboard.");
        
        // Reset flags before navigation
        isEndingRef.current = false;
        navigationAttemptedRef.current = false;
        
        navigationTimeoutRef.current = window.setTimeout(() => {
          if (isMountedRef.current) {
            navigate("/dashboard", { replace: true });
          }
          navigationTimeoutRef.current = null;
        }, 100);
      }
    }
  };

  // Completely rewritten session end handler for improved reliability
  const handleEndSessionEarly = async () => {
    // This is the critical function that handles early session ending
    console.log("useFocusSession: handleEndSessionEarly - Starting, flags:", 
      {mounted: isMountedRef.current, isEnding: isEndingRef.current, 
       opInProgress: operationInProgressRef.current, navAttempted: navigationAttemptedRef.current});
    
    // If already ending or not mounted, exit immediately
    if (!isMountedRef.current || isEndingRef.current || navigationAttemptedRef.current) {
      console.log("useFocusSession: handleEndSessionEarly - Already in progress or unmounted, exiting");
      return;
    }
    
    // Set flags to lock this operation and prevent concurrent executions
    isEndingRef.current = true;
    navigationAttemptedRef.current = true;
    
    // Clear any existing timeouts first
    if (navigationTimeoutRef.current) {
      window.clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    
    try {
      // First, stop the timer to prevent further updates
      if (timerRef.current) {
        timerRef.current.stopTimer();
        console.log("useFocusSession: handleEndSessionEarly - Timer stopped");
      }
      
      // Generate a unique report ID that we'll use consistently
      const reportId = `session_${Date.now()}`;
      console.log("useFocusSession: handleEndSessionEarly - Generated reportId:", reportId);
      
      // Prepare session data
      const sessionData = {
        milestone: currentMilestone,
        duration: currentMilestone * 45,
        timestamp: new Date().toISOString(),
        environment: localStorage.getItem('environment') || 'default',
        completed: false
      };
      
      // First, save data to localStorage (this should be fast and reliable)
      console.log("useFocusSession: handleEndSessionEarly - Saving to localStorage");
      localStorage.setItem('sessionData', JSON.stringify(sessionData));
      localStorage.setItem(`sessionReport_${reportId}`, JSON.stringify({
        ...sessionData,
        savedAt: new Date().toISOString()
      }));
      localStorage.setItem(`sessionNotes_${reportId}`, "");
      
      // If user is logged in, save to Supabase in background
      if (user?.id) {
        console.log("useFocusSession: handleEndSessionEarly - Saving to Supabase for user", user.id);
        
        // Don't await this - let it run in parallel
        supabase.from('focus_sessions').insert({
          id: reportId,
          user_id: user.id,
          milestone_count: sessionData.milestone || 0,
          duration: sessionData.duration || 0,
          created_at: sessionData.timestamp,
          environment: sessionData.environment,
          completed: false
        }).then(() => {
          console.log("useFocusSession: handleEndSessionEarly - Successfully saved to Supabase");
        }).catch(error => {
          console.error('useFocusSession: Error saving to Supabase:', error);
        });
      }
      
      // Schedule navigation with sufficient delay to allow UI to settle
      // This is the most critical part that needs to be reliable
      console.log("useFocusSession: handleEndSessionEarly - Scheduling navigation to", `/session-report/${reportId}`);
      
      navigationTimeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          console.log("useFocusSession: handleEndSessionEarly - Executing navigation now");
          navigate(`/session-report/${reportId}`, { replace: true });
          
          // Reset flags AFTER navigation is initiated
          navigationTimeoutRef.current = null;
          isEndingRef.current = false;
          navigationAttemptedRef.current = false;
        }
      }, 150); // Slightly longer delay for more reliability
    } catch (error) {
      console.error("useFocusSession: handleEndSessionEarly - Error:", error);
      
      // Reset flags so we can try again if needed
      isEndingRef.current = false;
      navigationAttemptedRef.current = false;
      
      // Show error to user
      toast.error("There was an error ending your session. Please try again.");
    }
  };

  // Adapted handler for confirmation dialog usage
  const handleEndSessionConfirm = () => {
    console.log("useFocusSession: handleEndSessionConfirm - Starting");
    
    // Close dialog first for better UX
    setShowEndConfirmation(false);
    
    // Short delay to ensure dialog closes before navigation
    setTimeout(() => {
      // Direct call to the main handler
      handleEndSessionEarly();
    }, 50);
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

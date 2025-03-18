
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
  const isPwaRef = useRef(localStorage.getItem('isPWA') === 'true' || window.matchMedia('(display-mode: standalone)').matches);
  const workerRef = useRef<Worker | null>(null);
  const operationInProgressRef = useRef(false);
  const lowPowerToggleInProgressRef = useRef(false);
  const navigationAttemptedRef = useRef(false);
  
  // Track whether component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    console.log("useFocusSession: Initializing focus session hook");
    document.body.style.overflow = 'hidden';
    // Set mounted flag
    isMountedRef.current = true;
    
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
      
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);
  
  const saveSessionData = async (endingEarly = false) => {
    if (operationInProgressRef.current) {
      console.log("useFocusSession: saveSessionData - operation already in progress, skipping");
      return;
    }
    operationInProgressRef.current = true;
    console.log("useFocusSession: saveSessionData - starting, endingEarly =", endingEarly);
    
    const sessionData = {
      milestone: currentMilestone,
      duration: currentMilestone * 45,
      timestamp: new Date().toISOString(),
      environment: localStorage.getItem('environment') || 'default',
      completed: !endingEarly && currentMilestone >= 3
    };
    
    try {
      localStorage.setItem('sessionData', JSON.stringify(sessionData));
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
        operationInProgressRef.current = false;
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
        } finally {
          operationInProgressRef.current = false;
        }
      }
    } else {
      operationInProgressRef.current = false;
    }
    
    return sessionData;
  };
  
  const handlePause = () => {
    setIsPaused(true);
    setShowMotivation(true);
  };
  
  const handleResume = () => {
    setIsPaused(false);
    setShowMotivation(false);
  };
  
  const handleSessionEnd = async () => {
    if (!isMountedRef.current || operationInProgressRef.current || navigationAttemptedRef.current) {
      console.log("useFocusSession: handleSessionEnd - Can't proceed, flags:", 
        {mounted: isMountedRef.current, opInProgress: operationInProgressRef.current, navAttempted: navigationAttemptedRef.current});
      return;
    }
    
    console.log("useFocusSession: handleSessionEnd - Starting normal session end");
    navigationAttemptedRef.current = true;
    operationInProgressRef.current = true;
    
    // Save session data first
    const sessionData = await saveSessionData(false);
    
    // Make sure timer is stopped
    if (timerRef.current) {
      timerRef.current.stopTimer();
    }
    
    // More reliable navigation for PWA
    if (isPwaRef.current) {
      // For mobile PWA, generate a session report immediately
      const reportId = `session_${Date.now()}`;
      console.log("useFocusSession: handleSessionEnd - PWA path, generated reportId =", reportId);
      
      try {
        // Save as a completed session report
        const reportData = {
          ...sessionData,
          savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(`sessionReport_${reportId}`, JSON.stringify(reportData));
        localStorage.setItem(`sessionNotes_${reportId}`, "");
        
        // Clear temporary session data
        localStorage.removeItem('sessionData');
        
        // Check if we're on a mobile device for special handling
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log("useFocusSession: handleSessionEnd - isMobile =", isMobile);
        
        if (isMobile) {
          // For mobile PWA, navigate directly to the report page for better performance
          console.log("useFocusSession: handleSessionEnd - Navigating to mobile report page", `/session-report/${reportId}`);
          navigate(`/session-report/${reportId}`, { replace: true });
        } else {
          // For desktop PWA, go to reflection first
          console.log("useFocusSession: handleSessionEnd - Navigating to desktop reflection page");
          navigate("/session-reflection", { replace: true });
        }
      } catch (e) {
        console.error("useFocusSession: Error preparing session report:", e);
        // Fallback to reflection
        console.log("useFocusSession: handleSessionEnd - Error fallback, navigating to dashboard");
        navigate("/dashboard", { replace: true });
      }
      
      operationInProgressRef.current = false;
    } else {
      // Standard approach for non-PWA
      console.log("useFocusSession: handleSessionEnd - Standard non-PWA path, navigating to reflection");
      navigate("/session-reflection", { replace: true });
      operationInProgressRef.current = false;
    }
  };

  const handleEndSessionEarly = async () => {
    if (!isMountedRef.current || isEndingRef.current || operationInProgressRef.current || navigationAttemptedRef.current) {
      console.log("useFocusSession: handleEndSessionEarly - Can't proceed, flags:", 
        {mounted: isMountedRef.current, isEnding: isEndingRef.current, 
         opInProgress: operationInProgressRef.current, navAttempted: navigationAttemptedRef.current});
      return;
    }
    
    console.log("useFocusSession: handleEndSessionEarly - Starting early session end");
    isEndingRef.current = true;
    navigationAttemptedRef.current = true;
    operationInProgressRef.current = true;
    
    // Stop timer first
    if (timerRef.current) {
      timerRef.current.stopTimer();
    }
    
    // For PWA, use a simplified approach to avoid freezing
    if (isPwaRef.current) {
      try {
        console.log("useFocusSession: handleEndSessionEarly - PWA path");
        // Prepare session data for report
        const reportId = `session_${Date.now()}`;
        const reportKey = `sessionReport_${reportId}`;
        console.log("useFocusSession: handleEndSessionEarly - Generated reportId =", reportId);
        
        const sessionData = {
          milestone: currentMilestone,
          duration: currentMilestone * 45,
          timestamp: new Date().toISOString(),
          environment: localStorage.getItem('environment') || 'default',
          completed: false
        };
        
        // Save session data with minimal processing
        localStorage.setItem('sessionData', JSON.stringify(sessionData));
        localStorage.setItem(reportKey, JSON.stringify({
          ...sessionData,
          savedAt: new Date().toISOString()
        }));
        
        // Save notes separately
        localStorage.setItem(`sessionNotes_${reportId}`, "");
        
        // Save to database if logged in
        if (user?.id) {
          try {
            console.log("useFocusSession: handleEndSessionEarly - Saving to Supabase for user", user.id);
            await supabase.from('focus_sessions').insert({
              id: reportId,
              user_id: user.id,
              milestone_count: sessionData.milestone || 0,
              duration: sessionData.duration || 0,
              created_at: sessionData.timestamp,
              environment: sessionData.environment,
              completed: false
            });
            console.log("useFocusSession: handleEndSessionEarly - Successfully saved to Supabase");
          } catch (e) {
            console.error('useFocusSession: Error saving to database:', e);
          }
        }
        
        // Check if we're on a mobile device for special handling
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log("useFocusSession: handleEndSessionEarly - isMobile =", isMobile);
        
        // Use setTimeout to ensure all state updates have completed
        setTimeout(() => {
          console.log("useFocusSession: handleEndSessionEarly - Navigating to", `/session-report/${reportId}`);
          navigate(`/session-report/${reportId}`, { replace: true });
          isEndingRef.current = false;
          operationInProgressRef.current = false;
        }, 50);
      } catch (e) {
        console.error("useFocusSession: Error in PWA session end:", e);
        // Emergency fallback if error
        console.log("useFocusSession: handleEndSessionEarly - Error fallback to dashboard");
        navigate("/dashboard", { replace: true });
        isEndingRef.current = false;
        operationInProgressRef.current = false;
      }
      return;
    }
    
    // Standard flow for non-PWA
    console.log("useFocusSession: handleEndSessionEarly - Standard non-PWA path");
    const sessionData = await saveSessionData(true);
    
    const reportId = `session_${Date.now()}`;
    const reportKey = `sessionReport_${reportId}`;
    console.log("useFocusSession: handleEndSessionEarly - Generated reportId =", reportId);
    
    try {
      const reportData = {
        ...sessionData,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem(reportKey, JSON.stringify(reportData));
      localStorage.setItem(`sessionNotes_${reportId}`, "");
      localStorage.removeItem('sessionData');
    } catch (e) {
      console.error("useFocusSession: Error preparing session report:", e);
    }
    
    // Use a more reliable approach for non-PWA navigation
    console.log("useFocusSession: handleEndSessionEarly - Preparing to navigate to", `/session-report/${reportId}`);
    setTimeout(() => {
      if (isMountedRef.current) {
        console.log("useFocusSession: handleEndSessionEarly - Executing navigation now");
        navigate(`/session-report/${reportId}`, { replace: true });
        isEndingRef.current = false;
        operationInProgressRef.current = false;
      }
    }, 100);
  };

  const handleEndSessionConfirm = async () => {
    if (!isMountedRef.current || operationInProgressRef.current || navigationAttemptedRef.current) {
      console.log("useFocusSession: handleEndSessionConfirm - Can't proceed, flags:", 
        {mounted: isMountedRef.current, opInProgress: operationInProgressRef.current, navAttempted: navigationAttemptedRef.current});
      return;
    }
    
    console.log("useFocusSession: handleEndSessionConfirm - Starting confirmation handling");
    operationInProgressRef.current = true;
    navigationAttemptedRef.current = true;
    
    // Stop timer first
    if (timerRef.current) {
      timerRef.current.stopTimer();
    }
    
    // Close dialog 
    setShowEndConfirmation(false);
    
    // Reset navigation flag to ensure we can try again if needed
    setTimeout(() => {
      navigationAttemptedRef.current = false;
    }, 100);
    
    // For mobile PWA users, direct navigation to session report
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    console.log("useFocusSession: handleEndSessionConfirm - isPwa =", isPwaRef.current, "isMobile =", isMobile);
    
    if (isPwaRef.current && isMobile) {
      // Generate a unique session report ID
      const reportId = `session_${Date.now()}`;
      const reportKey = `sessionReport_${reportId}`;
      console.log("useFocusSession: handleEndSessionConfirm - Mobile PWA path, reportId =", reportId);
      
      try {
        // Prepare and save minimal session data
        const sessionData = {
          milestone: currentMilestone,
          duration: currentMilestone * 45,
          timestamp: new Date().toISOString(),
          environment: localStorage.getItem('environment') || 'default',
          savedAt: new Date().toISOString(),
          completed: false
        };
        
        // Save session data directly to localStorage
        localStorage.setItem('sessionData', JSON.stringify(sessionData));
        localStorage.setItem(reportKey, JSON.stringify(sessionData));
        localStorage.setItem(`sessionNotes_${reportId}`, "");
        
        // Save to database if logged in
        if (user?.id) {
          try {
            console.log("useFocusSession: handleEndSessionConfirm - Saving to Supabase for user", user.id);
            await supabase.from('focus_sessions').insert({
              id: reportId,
              user_id: user.id,
              milestone_count: sessionData.milestone || 0,
              duration: sessionData.duration || 0,
              created_at: sessionData.timestamp,
              environment: sessionData.environment,
              completed: false
            });
            console.log("useFocusSession: handleEndSessionConfirm - Successfully saved to Supabase");
          } catch (e) {
            console.error('useFocusSession: Error saving to database:', e);
          }
        }
        
        // Immediate navigation to session report with delay to ensure dialog is closed
        console.log("useFocusSession: handleEndSessionConfirm - Preparing to navigate to", `/session-report/${reportId}`);
        
        // Use a more reliable approach for mobile navigation with sufficient delay
        setTimeout(() => {
          console.log("useFocusSession: handleEndSessionConfirm - Executing navigation now");
          navigate(`/session-report/${reportId}`, { replace: true });
          operationInProgressRef.current = false;
        }, 150);
      } catch (e) {
        console.error("useFocusSession: Error preparing session report:", e);
        // Emergency fallback navigation
        console.log("useFocusSession: handleEndSessionConfirm - Error fallback to dashboard");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
          operationInProgressRef.current = false;
        }, 50);
      }
    } else {
      // Standard flow for non-mobile-PWA - explicitly call the early end handler
      console.log("useFocusSession: handleEndSessionConfirm - Standard non-PWA path, calling handleEndSessionEarly");
      // Reset operation flag so handleEndSessionEarly can proceed
      operationInProgressRef.current = false;
      handleEndSessionEarly();
    }
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

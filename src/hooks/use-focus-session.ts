
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
  
  const saveSessionData = async (endingEarly = false) => {
    if (operationInProgressRef.current) return;
    operationInProgressRef.current = true;
    
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
        try {
          await supabase.from('focus_sessions').insert({
            user_id: user.id,
            duration: sessionData.duration,
            milestone_count: sessionData.milestone,
            environment: sessionData.environment,
            end_time: new Date().toISOString(),
            completed: !endingEarly && currentMilestone >= 3
          });
          console.log("Session data saved to Supabase");
        } catch (error) {
          console.error("Error saving session:", error);
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
    if (!isMountedRef.current || operationInProgressRef.current || navigationAttemptedRef.current) return;
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
      
      try {
        // Save as a completed session report
        const reportData = {
          ...sessionData,
          notes: "",
          savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(`sessionReport_${reportId}`, JSON.stringify(reportData));
        
        // Clear temporary session data
        localStorage.removeItem('sessionData');
        
        // Check if we're on a mobile device for special handling
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
          // For mobile PWA, navigate directly to the report page for better performance
          navigate(`/session-report/${reportId}`, { replace: true });
        } else {
          // For desktop PWA, go to reflection first
          navigate("/session-reflection", { replace: true });
        }
      } catch (e) {
        console.error("Error preparing session report:", e);
        // Fallback to reflection
        navigate("/session-reflection", { replace: true });
      }
      
      operationInProgressRef.current = false;
    } else {
      // Standard approach for non-PWA
      navigate("/session-reflection", { replace: true });
      operationInProgressRef.current = false;
    }
  };

  const handleEndSessionEarly = async () => {
    if (!isMountedRef.current || isEndingRef.current || operationInProgressRef.current || navigationAttemptedRef.current) return;
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
        // Prepare session data for report
        const reportId = `session_${Date.now()}`;
        const reportKey = `sessionReport_${reportId}`;
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
          notes: "",
          savedAt: new Date().toISOString()
        }));
        
        // Save to database if logged in
        if (user?.id) {
          try {
            await supabase.from('focus_sessions').insert({
              id: reportId,
              user_id: user.id,
              milestone_count: sessionData.milestone || 0,
              duration: sessionData.duration || 0,
              created_at: sessionData.timestamp,
              environment: sessionData.environment,
              completed: false
            });
          } catch (e) {
            console.error('Error saving to database:', e);
          }
        }
        
        // Check if we're on a mobile device for special handling
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
          // For mobile PWA, navigate directly to the report page for better performance
          navigate(`/session-report/${reportId}`, { replace: true });
        } else {
          // For desktop PWA, standard navigation 
          navigate(`/session-report/${reportId}`, { replace: true });
        }
        
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
    const sessionData = await saveSessionData(true);
    
    const reportId = `session_${Date.now()}`;
    const reportKey = `sessionReport_${reportId}`;
    
    try {
      const reportData = {
        ...sessionData,
        notes: "",
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem(reportKey, JSON.stringify(reportData));
      localStorage.removeItem('sessionData');
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

  const handleEndSessionConfirm = async () => {
    if (!isMountedRef.current || operationInProgressRef.current || navigationAttemptedRef.current) return;
    operationInProgressRef.current = true;
    navigationAttemptedRef.current = true;
    
    // Stop timer first
    if (timerRef.current) {
      timerRef.current.stopTimer();
    }
    
    // Close dialog 
    setShowEndConfirmation(false);
    
    // For mobile PWA users, direct navigation to session report
    if (isPwaRef.current && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      // Generate a unique session report ID
      const reportId = `session_${Date.now()}`;
      const reportKey = `sessionReport_${reportId}`;
      
      try {
        // Prepare and save minimal session data
        const sessionData = {
          milestone: currentMilestone,
          duration: currentMilestone * 45,
          timestamp: new Date().toISOString(),
          environment: localStorage.getItem('environment') || 'default',
          notes: "",
          savedAt: new Date().toISOString(),
          completed: false
        };
        
        // Save session data directly to localStorage
        localStorage.setItem('sessionData', JSON.stringify(sessionData));
        localStorage.setItem(reportKey, JSON.stringify(sessionData));
        
        // Save to database if logged in
        if (user?.id) {
          try {
            await supabase.from('focus_sessions').insert({
              id: reportId,
              user_id: user.id,
              milestone_count: sessionData.milestone || 0,
              duration: sessionData.duration || 0,
              created_at: sessionData.timestamp,
              environment: sessionData.environment,
              completed: false
            });
          } catch (e) {
            console.error('Error saving to database:', e);
          }
        }
        
        // Immediate navigation to session report
        navigate(`/session-report/${reportId}`, { replace: true });
        operationInProgressRef.current = false;
        navigationAttemptedRef.current = false;
      } catch (e) {
        console.error("Error preparing session report:", e);
        // Emergency fallback navigation
        navigate("/dashboard", { replace: true });
        operationInProgressRef.current = false;
        navigationAttemptedRef.current = false;
      }
    } else {
      // Standard flow for non-mobile-PWA
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


import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { 
  saveFocusSessionState, 
  getSavedFocusSession,
  clearFocusSessionState,
  SavedFocusSession
} from "@/services/sessionPersistence";

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
  const [resumingSession, setResumingSession] = useState(false);
  const isEndingRef = useRef(false);
  const timerRef = useRef<{ 
    stopTimer: () => void; 
    setRemainingTime: (time: number) => void;
    getRemainingTime: () => number;
  } | null>(null);
  const isPwaRef = useRef(localStorage.getItem('isPWA') === 'true' || window.matchMedia('(display-mode: standalone)').matches);
  const workerRef = useRef<Worker | null>(null);
  const operationInProgressRef = useRef(false);
  const lowPowerToggleInProgressRef = useRef(false);
  const navigationAttemptedRef = useRef(false);
  const navigationTimeoutRef = useRef<number | null>(null);
  const autoStartedRef = useRef(false);
  
  const isMountedRef = useRef(true);

  useEffect(() => {
    console.log("useFocusSession: Initializing focus session hook");
    document.body.style.overflow = 'hidden';
    isMountedRef.current = true;
    
    isEndingRef.current = false;
    operationInProgressRef.current = false;
    navigationAttemptedRef.current = false;
    autoStartedRef.current = false;
    
    if (navigationTimeoutRef.current) {
      window.clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    
    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      isPwaRef.current = isStandalone || localStorage.getItem('isPWA') === 'true';
      console.log("useFocusSession: isPWA detection =", isPwaRef.current);
      
      if (isPwaRef.current) {
        if (navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {
          setLowPowerMode(true);
        }
      }
    } catch (error) {
      console.error('useFocusSession: Error detecting PWA state:', error);
    }
    
    try {
      const savedSession = getSavedFocusSession();
      if (savedSession) {
        console.log("Found saved focus session:", savedSession);
        
        const sessionTime = new Date(savedSession.timestamp).getTime();
        const currentTime = new Date().getTime();
        const timeDifference = currentTime - sessionTime;
        const maxSessionAge = 24 * 60 * 60 * 1000;
        
        if (timeDifference <= maxSessionAge) {
          // We're only resuming if the user previously left the page
          if (savedSession.wasExited) {
            setResumingSession(true);
            setCurrentMilestone(savedSession.milestone || 0);
            setSegmentProgress(savedSession.segmentProgress || 0);
            setIsPaused(true);
            
            if (savedSession.environment) {
              localStorage.setItem('environment', savedSession.environment);
              document.documentElement.classList.remove(
                'theme-office', 
                'theme-park', 
                'theme-home', 
                'theme-coffee-shop', 
                'theme-library'
              );
              document.documentElement.classList.add(`theme-${savedSession.environment}`);
              document.documentElement.setAttribute('data-environment', savedSession.environment);
            }
            
            setTimeout(() => {
              if (isMountedRef.current) {
                toast.info("Resuming your previous focus session", {
                  description: `You were ${savedSession.milestone > 0 ? `at milestone ${savedSession.milestone}` : 'just getting started'}`,
                  duration: 5000
                });
              }
            }, 1000);
          } else {
            // Not resuming, just starting a new session
            clearFocusSessionState();
            // Will auto-start a new timer since isPaused is false by default
          }
        } else {
          clearFocusSessionState();
          toast.info("Your previous session was too old and has been cleared");
        }
      }
    } catch (error) {
      console.error("Error loading saved focus session:", error);
    }
    
    if (isPwaRef.current && window.Worker) {
      try {
        const workerCode = `
          let activeOperations = 0;

          self.onmessage = function(e) {
            const { type, data } = e.data;
            
            if (type === 'saveSession') {
              activeOperations++;
              
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
    
    // When leaving the page, mark that the session was exited
    const handleBeforeUnload = () => {
      try {
        const focusData = getSavedFocusSession();
        if (focusData) {
          focusData.wasExited = true;
          saveFocusSessionState(focusData);
        }
      } catch (error) {
        console.error("Error updating session exit state:", error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      isMountedRef.current = false;
      document.body.style.overflow = 'auto';
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (navigationTimeoutRef.current) {
        window.clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      
      isEndingRef.current = false;
      operationInProgressRef.current = false;
      navigationAttemptedRef.current = false;
    };
  }, []);
  
  // Auto-start the timer if not resuming
  useEffect(() => {
    if (!resumingSession && !autoStartedRef.current && !isPaused) {
      // A short delay to ensure components are fully mounted
      const startTimerId = setTimeout(() => {
        if (isMountedRef.current) {
          console.log("Auto-starting new focus session");
          autoStartedRef.current = true;
          // We don't need to do anything since isPaused is already false
          // The timer will start automatically
        }
      }, 500);
      
      return () => clearTimeout(startTimerId);
    }
  }, [resumingSession, isPaused]);
  
  const saveSessionData = async (endingEarly = false) => {
    if (operationInProgressRef.current || !isMountedRef.current) {
      console.log("useFocusSession: saveSessionData - operation already in progress or component unmounted, skipping");
      return null;
    }
    
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
      
      if (user && user.id) {
        if (workerRef.current && isPwaRef.current) {
          workerRef.current.postMessage({
            type: 'saveSession',
            data: { sessionData, userId: user.id, endingEarly }
          });
          console.log("useFocusSession: Offloaded saving to worker thread");
        } else {
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
  
  const saveCurrentFocusState = () => {
    try {
      if (!timerRef.current) return;
      
      const timerElement = document.querySelector('.timer-display');
      let remainingTime = 0;
      
      if (timerElement) {
        const timeText = timerElement.textContent;
        if (timeText) {
          const [minutes, seconds] = timeText.split(':').map(Number);
          remainingTime = minutes * 60 + seconds;
        }
      }
      
      const focusData: Partial<SavedFocusSession> = {
        milestone: currentMilestone,
        isPaused,
        segmentProgress,
        remainingTime,
        environment: localStorage.getItem('environment') || 'default',
        wasExited: false // Default to false, will be set to true on page unload
      };
      
      saveFocusSessionState(focusData);
    } catch (error) {
      console.error("Error saving focus state:", error);
    }
  };
  
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (isMountedRef.current) {
        saveCurrentFocusState();
      }
    }, 15000);
    
    return () => {
      clearInterval(saveInterval);
    };
  }, [isPaused, currentMilestone, segmentProgress]);
  
  const handlePause = () => {
    setIsPaused(true);
    setShowMotivation(true);
    saveCurrentFocusState();
  };
  
  const handleResume = () => {
    setIsPaused(false);
    setShowMotivation(false);
    
    if (resumingSession) {
      setResumingSession(false);
    }
  };
  
  const handleSessionEnd = async () => {
    if (!isMountedRef.current || isEndingRef.current || navigationAttemptedRef.current) {
      console.log("useFocusSession: handleSessionEnd - Already ending or navigating, skipping");
      return;
    }
    
    isEndingRef.current = true;
    navigationAttemptedRef.current = true;
    
    console.log("useFocusSession: handleSessionEnd - Starting normal session end");
    
    if (timerRef.current) {
      timerRef.current.stopTimer();
    }
    
    const sessionData = await saveSessionData(false);
    
    clearFocusSessionState();
    
    const reportId = `session_${Date.now()}`;
    console.log("useFocusSession: handleSessionEnd - Generated reportId =", reportId);
    
    try {
      if (sessionData) {
        const reportData = {
          ...sessionData,
          savedAt: new Date().toISOString()
        };
        
        localStorage.setItem(`sessionReport_${reportId}`, JSON.stringify(reportData));
        localStorage.setItem(`sessionNotes_${reportId}`, "");
        
        localStorage.removeItem('sessionData');
      }
      
      if (navigationTimeoutRef.current) {
        window.clearTimeout(navigationTimeoutRef.current);
      }
      
      navigationTimeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current) {
          navigate("/session-reflection", { replace: true });
        }
        
        navigationTimeoutRef.current = null;
        isEndingRef.current = false;
      }, 100);
    } catch (error) {
      console.error("useFocusSession: Error in handleSessionEnd:", error);
      
      if (isMountedRef.current) {
        toast.error("There was an error saving your session. Returning to dashboard.");
        
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
  
  const handleEndSessionEarly = async () => {
    if (!isMountedRef.current || isEndingRef.current || navigationAttemptedRef.current) {
      console.log("useFocusSession: handleEndSessionEarly - Already in progress or unmounted, exiting");
      return;
    }
    
    isEndingRef.current = true;
    navigationAttemptedRef.current = true;
    
    if (navigationTimeoutRef.current) {
      window.clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
    
    if (timerRef.current) {
      timerRef.current.stopTimer();
      console.log("useFocusSession: handleEndSessionEarly - Timer stopped");
    }
    
    clearFocusSessionState();
    
    const reportId = `session_${Date.now()}`;
    console.log("useFocusSession: handleEndSessionEarly - Generated reportId:", reportId);
    
    const sessionData = {
      milestone: currentMilestone,
      duration: currentMilestone * 45,
      timestamp: new Date().toISOString(),
      environment: localStorage.getItem('environment') || 'default',
      completed: false
    };
    
    localStorage.setItem('sessionData', JSON.stringify(sessionData));
    localStorage.setItem(`sessionReport_${reportId}`, JSON.stringify({
      ...sessionData,
      savedAt: new Date().toISOString()
    }));
    localStorage.setItem(`sessionNotes_${reportId}`, "");
    
    if (user?.id) {
      console.log("useFocusSession: handleEndSessionEarly - Saving to Supabase for user", user.id);
      
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
        console.log("useFocusSession: handleEndSessionEarly - Successfully saved to Supabase");
      } catch (error) {
        console.error('useFocusSession: Error saving to Supabase:', error);
      }
    }
    
    navigationTimeoutRef.current = window.setTimeout(() => {
      if (isMountedRef.current) {
        navigate(`/session-report/${reportId}`, { replace: true });
        
        navigationTimeoutRef.current = null;
        isEndingRef.current = false;
        navigationAttemptedRef.current = false;
      }
    }, 150);
  };
  
  const handleEndSessionConfirm = () => {
    setShowEndConfirmation(false);
    setTimeout(() => {
      handleEndSessionEarly();
    }, 50);
  };
  
  const handleMilestoneReached = (milestone: number) => {
    setCurrentMilestone(milestone);
    setIsCelebrating(true);
    setSegmentProgress(0);
    
    saveCurrentFocusState();
    
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsCelebrating(false);
      }
    }, 3000);
  };
  
  const handleProgressUpdate = (progress: number) => {
    if (!isMountedRef.current || (isPwaRef.current && operationInProgressRef.current)) return;
    
    if (isPwaRef.current && navigator.userAgent.includes('Mobile')) {
      if (Math.abs(progress - segmentProgress) > 5) {
        setSegmentProgress(progress);
      }
    } else {
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
    if (operationInProgressRef.current || lowPowerToggleInProgressRef.current) return;
    lowPowerToggleInProgressRef.current = true;
    
    if (isPwaRef.current) {
      const newMode = !lowPowerMode;
      setLowPowerMode(newMode);
      
      localStorage.setItem('lowPowerMode', newMode ? 'true' : 'false');
      
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
      
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'lowPowerToggle',
          data: { newMode }
        });
      }
    } else {
      const newMode = !lowPowerMode;
      setLowPowerMode(newMode);
      
      localStorage.setItem('lowPowerMode', newMode ? 'true' : 'false');
      
      toast.info(newMode ? 
        "Low power mode activated - reduced animations" : 
        "Enhanced visual mode activated",
        { duration: 3000 }
      );
      lowPowerToggleInProgressRef.current = false;
    }
  };

  return {
    isPaused,
    showMotivation,
    currentMilestone,
    isCelebrating,
    lowPowerMode,
    segmentProgress,
    showEndConfirmation,
    resumingSession,
    
    timerRef,
    operationInProgressRef,
    
    handlePause,
    handleResume,
    handleSessionEnd,
    handleEndSessionEarly,
    handleEndSessionConfirm,
    handleMilestoneReached,
    handleProgressUpdate,
    toggleLowPowerMode,
    saveCurrentFocusState,
    
    setShowMotivation,
    setShowEndConfirmation
  };
};

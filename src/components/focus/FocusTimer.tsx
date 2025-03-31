import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FocusTimerProps {
  duration: number;
  isPaused: boolean;
  onComplete: () => void;
  onMilestoneReached: (milestone: number) => void;
  onProgressUpdate: (progress: number) => void;
  lowPowerMode: boolean;
}

const FocusTimer = forwardRef<
  { stopTimer: () => void; setRemainingTime: (time: number) => void; getRemainingTime: () => number },
  FocusTimerProps
>(({ duration, isPaused, onComplete, onMilestoneReached, onProgressUpdate, lowPowerMode }, ref) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [segmentDuration] = useState(45 * 60); // 45 minute segments
  const [milestone, setMilestone] = useState(0);
  const timerIdRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const visibilityRef = useRef('visible');
  const bgModeTimerRef = useRef<number | null>(null);
  
  useImperativeHandle(ref, () => ({
    stopTimer: () => {
      if (timerIdRef.current) {
        window.clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    },
    setRemainingTime: (time: number) => {
      setTimeLeft(time);
    },
    getRemainingTime: () => {
      return timeLeft;
    }
  }));
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      visibilityRef.current = document.visibilityState;
      
      if (document.visibilityState === 'hidden' && !isPaused) {
        lastTickRef.current = Date.now();
        
        if (timerIdRef.current) {
          window.clearInterval(timerIdRef.current);
          timerIdRef.current = null;
        }
        
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'START_BACKGROUND_TIMER',
            data: {
              duration: timeLeft,
              timestamp: Date.now()
            }
          });
        } else {
          bgModeTimerRef.current = window.setTimeout(() => {
            checkBackgroundTimer();
          }, 1000);
        }
      } else if (document.visibilityState === 'visible' && !isPaused) {
        if (bgModeTimerRef.current) {
          window.clearTimeout(bgModeTimerRef.current);
          bgModeTimerRef.current = null;
        }
        
        if (lastTickRef.current !== null) {
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - lastTickRef.current) / 1000);
          
          if (elapsedSeconds > 0) {
            setTimeLeft(prev => Math.max(0, prev - elapsedSeconds));
          }
          
          lastTickRef.current = null;
        }
        
        startTimer();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (timerIdRef.current) {
        window.clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
      
      if (bgModeTimerRef.current) {
        window.clearTimeout(bgModeTimerRef.current);
        bgModeTimerRef.current = null;
      }
    };
  }, [isPaused]);
  
  const startTimer = () => {
    if (timerIdRef.current) {
      window.clearInterval(timerIdRef.current);
    }
    
    timerIdRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerIdRef.current) {
            window.clearInterval(timerIdRef.current);
            timerIdRef.current = null;
          }
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const checkBackgroundTimer = () => {
    if (visibilityRef.current === 'hidden' && !isPaused) {
      const now = Date.now();
      
      if (lastTickRef.current !== null) {
        const elapsedSeconds = Math.floor((now - lastTickRef.current) / 1000);
        
        if (elapsedSeconds > 0) {
          setTimeLeft(prev => Math.max(0, prev - elapsedSeconds));
          lastTickRef.current = now;
        }
      }
      
      bgModeTimerRef.current = window.setTimeout(() => {
        checkBackgroundTimer();
      }, 1000);
    }
  };
  
  useEffect(() => {
    if (isPaused) {
      if (timerIdRef.current) {
        window.clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
      
      if (bgModeTimerRef.current) {
        window.clearTimeout(bgModeTimerRef.current);
        bgModeTimerRef.current = null;
      }
      
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'STOP_BACKGROUND_TIMER'
        });
      }
    } else {
      if (document.visibilityState === 'visible') {
        startTimer();
      } else if (lastTickRef.current === null) {
        lastTickRef.current = Date.now();
        
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'START_BACKGROUND_TIMER',
            data: {
              duration: timeLeft,
              timestamp: Date.now()
            }
          });
        } else {
          bgModeTimerRef.current = window.setTimeout(() => {
            checkBackgroundTimer();
          }, 1000);
        }
      }
    }
    
    return () => {
      if (timerIdRef.current) {
        window.clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    };
  }, [isPaused, duration]);
  
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);
  
  useEffect(() => {
    const currentSegment = Math.floor((duration - timeLeft) / segmentDuration) + 1;
    const segmentTimeLeft = timeLeft % segmentDuration;
    const segmentProgress = 100 - (segmentTimeLeft / segmentDuration * 100);
    
    onProgressUpdate(segmentProgress);
    
    if (currentSegment > milestone) {
      setMilestone(currentSegment);
      onMilestoneReached(currentSegment);
    }
  }, [timeLeft, duration, segmentDuration, milestone, onMilestoneReached, onProgressUpdate]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    return () => {
      if (timerIdRef.current) {
        window.clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
      
      if (bgModeTimerRef.current) {
        window.clearTimeout(bgModeTimerRef.current);
        bgModeTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <div className={cn(
        "w-64 h-64 mx-auto relative flex items-center justify-center",
        "rounded-full",
        lowPowerMode ? "bg-white/30" : "bg-white backdrop-blur-sm shadow-lg"
      )}>
        {!lowPowerMode && (
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-100"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ 
              scale: [0.8, 1.02, 0.95, 1],
              opacity: [0.5, 0.3, 0.4, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        )}
        
        <div className={cn(
          "z-10 text-5xl font-bold tabular-nums",
          "timer-display",
          isPaused ? "text-gray-400" : "text-gray-800"
        )}>
          {formatTime(timeLeft)}
        </div>
      </div>
    </div>
  );
});

FocusTimer.displayName = "FocusTimer";

export default FocusTimer;

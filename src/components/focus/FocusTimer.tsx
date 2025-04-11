
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type FocusTimerProps = {
  initialTime: number;
  onComplete?: () => void;
  onMilestoneReached?: (milestone: number) => void;
  onProgressUpdate?: (progress: number) => void;
  isPaused?: boolean;
  lowPowerMode?: boolean;
  className?: string;
  timerId?: string;
};

const FocusTimer = forwardRef<
  { stopTimer: () => void; setRemainingTime: (time: number) => void; getRemainingTime: () => number },
  FocusTimerProps
>(({ 
  initialTime,
  onComplete,
  onMilestoneReached,
  onProgressUpdate,
  isPaused = false,
  lowPowerMode = false,
  className,
  timerId = 'focus-session-timer'
}, ref) => {
  const [remainingTime, setRemainingTime] = useState(initialTime);
  const [animationKey, setAnimationKey] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const { theme } = useTheme();
  const startTimeRef = useRef<number>(Date.now());
  const lastTickTimeRef = useRef<number>(Date.now());
  const lastMilestoneRef = useRef<number>(-1);
  const hasCompletedRef = useRef<boolean>(false);
  const isMobile = useIsMobile();
  const backgroundModeRef = useRef<boolean>(false);
  const serviceWorkerAvailable = useRef<boolean>('serviceWorker' in navigator && navigator.serviceWorker.controller !== null);
  
  // Calculate milestones based on initialTime (typically 3 milestones)
  const milestoneTimePoints = [
    Math.floor(initialTime * 0.33),
    Math.floor(initialTime * 0.66),
    0 // Final milestone at completion
  ];
  
  // Set up background timer message listener
  useEffect(() => {
    const handleBackgroundTimerMessage = (event: MessageEvent) => {
      if (!event.data) return;
      
      // Handle completed timer message
      if (event.data.type === 'BACKGROUND_TIMER_COMPLETE' && event.data.timerId === timerId) {
        console.log('Background timer completed via service worker message');
        setRemainingTime(0);
        
        if (onComplete && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete();
        }
      }
      
      // Handle timer update message
      if (event.data.type === 'BACKGROUND_TIMER_UPDATE' && event.data.timerId === timerId) {
        console.log('Background timer update:', event.data.remainingTime);
        
        if (backgroundModeRef.current) {
          const newRemainingTime = event.data.remainingTime;
          setRemainingTime(newRemainingTime);
          
          if (onProgressUpdate) {
            const progress = 1 - (newRemainingTime / initialTime);
            onProgressUpdate(progress);
          }
          
          // Check if any milestones were reached while in background
          const timePassed = initialTime - newRemainingTime;
          milestoneTimePoints.forEach((milestoneTime, index) => {
            if (timePassed >= initialTime - milestoneTime && index > lastMilestoneRef.current) {
              if (onMilestoneReached) onMilestoneReached(index);
              lastMilestoneRef.current = index;
            }
          });
        }
      }
    };
    
    if (serviceWorkerAvailable.current) {
      navigator.serviceWorker.addEventListener('message', handleBackgroundTimerMessage);
    }
    
    return () => {
      if (serviceWorkerAvailable.current) {
        navigator.serviceWorker.removeEventListener('message', handleBackgroundTimerMessage);
      }
    };
  }, [initialTime, onComplete, onMilestoneReached, onProgressUpdate, timerId]);
  
  // Handle visibility change events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // App going to background
        enterBackgroundMode();
      } else {
        // App coming to foreground
        exitBackgroundMode();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPaused]);
  
  // Start or resume a background timer
  const startBackgroundTimer = () => {
    if (!serviceWorkerAvailable.current || isPaused) return;
    
    backgroundModeRef.current = true;
    
    if (navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        console.log('Background timer started response:', event.data);
      };
      
      navigator.serviceWorker.controller.postMessage({
        type: 'START_BACKGROUND_TIMER',
        id: timerId,
        duration: initialTime,
        startTime: startTimeRef.current,
        options: {
          notificationTitle: 'Focus Session Complete',
          notificationBody: 'Your focus session has finished.',
          notificationUrl: '/focus-session'
        }
      }, [messageChannel.port2]);
    }
  };
  
  // Stop a background timer
  const stopBackgroundTimer = () => {
    if (!serviceWorkerAvailable.current) return;
    
    backgroundModeRef.current = false;
    
    if (navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        console.log('Background timer stopped response:', event.data);
      };
      
      navigator.serviceWorker.controller.postMessage({
        type: 'STOP_BACKGROUND_TIMER',
        id: timerId
      }, [messageChannel.port2]);
    }
  };
  
  // Pause a background timer
  const pauseBackgroundTimer = () => {
    if (!serviceWorkerAvailable.current) return;
    
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PAUSE_BACKGROUND_TIMER',
        id: timerId
      });
    }
  };
  
  // Resume a background timer
  const resumeBackgroundTimer = () => {
    if (!serviceWorkerAvailable.current) return;
    
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'RESUME_BACKGROUND_TIMER',
        id: timerId
      });
    }
  };
  
  // When app goes to background
  const enterBackgroundMode = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (!isPaused && remainingTime > 0) {
      console.log('App entering background, starting background timer');
      startBackgroundTimer();
    } else if (isPaused) {
      console.log('App entering background while timer is paused');
    }
  };
  
  // When app comes back to foreground
  const exitBackgroundMode = () => {
    if (backgroundModeRef.current) {
      console.log('App coming to foreground, checking background timer status');
      backgroundModeRef.current = false;
      
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'GET_BACKGROUND_TIMER',
          id: timerId
        });
      }
      
      // If not paused, restart the normal interval timer
      if (!isPaused && remainingTime > 0) {
        startTimeRef.current = Date.now() - (initialTime - remainingTime) * 1000;
      }
    }
  };
  
  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    stopTimer: () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopBackgroundTimer();
    },
    setRemainingTime: (time: number) => {
      setRemainingTime(time);
      startTimeRef.current = Date.now() - (initialTime - time) * 1000;
      setAnimationKey(prev => prev + 1);
    },
    getRemainingTime: () => {
      return remainingTime;
    }
  }));
  
  useEffect(() => {
    if (!isPaused && remainingTime > 0) {
      startTimeRef.current = Date.now() - (initialTime - remainingTime) * 1000;
      lastTickTimeRef.current = Date.now();
      
      // When resuming, sync with background timer if needed
      if (backgroundModeRef.current && serviceWorkerAvailable.current) {
        resumeBackgroundTimer();
        backgroundModeRef.current = false; // Reset since we're in foreground now
      }
      
      intervalRef.current = window.setInterval(() => {
        if (document.visibilityState === 'hidden') {
          // Skip ticks while hidden - background timer will handle it
          return;
        }
        
        const now = Date.now();
        let elapsed = (now - startTimeRef.current) / 1000;
        let newRemainingTime = initialTime - elapsed;
        
        if (newRemainingTime <= 0) {
          newRemainingTime = 0;
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
          stopBackgroundTimer();
          
          // Only trigger onComplete once
          if (!hasCompletedRef.current && onComplete) {
            hasCompletedRef.current = true;
            onComplete();
          }
        }
        
        setRemainingTime(newRemainingTime);
        
        const timePassed = initialTime - newRemainingTime;
        milestoneTimePoints.forEach((milestoneTime, index) => {
          if (timePassed >= initialTime - milestoneTime && index > lastMilestoneRef.current) {
            if (onMilestoneReached) onMilestoneReached(index);
            lastMilestoneRef.current = index;
          }
        });
        
        if (onProgressUpdate) {
          const progress = 1 - (newRemainingTime / initialTime);
          onProgressUpdate(progress);
        }
        
        lastTickTimeRef.current = now;
      }, lowPowerMode ? 1000 : 100);
    } else if (isPaused && intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      
      // When pausing, also pause background timer if active
      if (backgroundModeRef.current && serviceWorkerAvailable.current) {
        pauseBackgroundTimer();
      }
    }
    
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, initialTime, onComplete, onMilestoneReached, onProgressUpdate, lowPowerMode, remainingTime]);
  
  // Reset the completed state when the component is reused
  useEffect(() => {
    hasCompletedRef.current = false;
  }, [initialTime]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBackgroundTimer();
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
  
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate color based on remaining time
  const getTimerColor = () => {
    const progress = 1 - (remainingTime / initialTime);
    
    if (progress < 0.33) {
      return theme === 'dark' ? 'border-green-500' : 'border-green-600'; // Starting color - green
    } else if (progress < 0.66) {
      return theme === 'dark' ? 'border-yellow-500' : 'border-yellow-600'; // Mid way - yellow
    } else {
      return theme === 'dark' ? 'border-red-500' : 'border-red-600'; // Almost complete - red
    }
  };

  // Calculate font size based on device
  const getTimerFontSize = () => {
    if (isMobile) {
      return 'text-4xl sm:text-5xl md:text-6xl';
    }
    return 'text-6xl';
  };

  return (
    <div className={cn("relative w-full max-w-md mx-auto", className)}>
      {/* Fixed circle that changes color based on remaining time */}
      <div
        className={cn(
          "absolute inset-0 rounded-full border-6 sm:border-8 transition-colors duration-300",
          getTimerColor(),
          theme === 'dark' ? 'border-opacity-75' : 'border-opacity-90'
        )}
      />
      
      <div className="relative flex items-center justify-center w-full h-full aspect-square">
        <span className={cn(
          getTimerFontSize(),
          "font-bold timer-display transition-all",
          remainingTime < initialTime * 0.25 && !isPaused ? "text-red-600" : ""
        )}>
          {formatTime(remainingTime)}
        </span>
      </div>
    </div>
  );
});

FocusTimer.displayName = 'FocusTimer';

export default FocusTimer;

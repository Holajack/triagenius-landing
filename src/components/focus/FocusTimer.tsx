
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

type FocusTimerProps = {
  initialTime: number;
  onComplete?: () => void;
  onMilestoneReached?: (milestone: number) => void;
  onProgressUpdate?: (progress: number) => void;
  isPaused?: boolean;
  lowPowerMode?: boolean;
  className?: string;
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
  className
}, ref) => {
  const [remainingTime, setRemainingTime] = useState(initialTime);
  const [animationKey, setAnimationKey] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const { theme } = useTheme();
  const startTimeRef = useRef<number>(Date.now());
  const lastTickTimeRef = useRef<number>(Date.now());
  const lastMilestoneRef = useRef<number>(-1);
  
  // Calculate milestones based on initialTime (typically 3 milestones)
  const milestoneTimePoints = [
    Math.floor(initialTime * 0.33),
    Math.floor(initialTime * 0.66),
    0 // Final milestone at completion
  ];
  
  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    stopTimer: () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
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
      
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        let elapsed = (now - startTimeRef.current) / 1000;
        let newRemainingTime = initialTime - elapsed;
        
        if (newRemainingTime <= 0) {
          newRemainingTime = 0;
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
          if (onComplete) onComplete();
        }
        
        setRemainingTime(newRemainingTime);
        
        const timePassed = initialTime - newRemainingTime;
        milestoneTimePoints.forEach((milestoneTime, index) => {
          if (timePassed >= milestoneTime && index > lastMilestoneRef.current) {
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
    }
    
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, initialTime, onComplete, onMilestoneReached, onProgressUpdate, lowPowerMode, remainingTime]);
  
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Return the rendered component
  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 border-primary animate-progress",
          theme === 'dark' ? 'border-opacity-50' : 'border-opacity-75',
          lowPowerMode ? 'transition-none' : 'transition-transform duration-100 ease-linear',
        )}
        style={{
          animationDuration: `${initialTime}s`,
          animationTimingFunction: 'linear',
          animationFillMode: 'forwards',
          animationPlayState: isPaused ? 'paused' : 'running',
          transformOrigin: 'top',
          transform: `rotate(${(1 - (remainingTime / initialTime)) * 360}deg)`,
        }}
        key={animationKey}
      />
      <div className="relative flex items-center justify-center w-full h-full">
        <span className="text-4xl font-bold">{formatTime(remainingTime)}</span>
      </div>
    </div>
  );
});

FocusTimer.displayName = 'FocusTimer';

export default FocusTimer;

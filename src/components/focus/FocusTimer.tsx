
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

  return (
    <div className={cn("relative w-full max-w-md mx-auto", className)}>
      {/* Fixed circle that changes color based on remaining time */}
      <div
        className={cn(
          "absolute inset-0 rounded-full border-8 transition-colors duration-300",
          getTimerColor(),
          theme === 'dark' ? 'border-opacity-75' : 'border-opacity-90'
        )}
      />
      
      <div className="relative flex items-center justify-center w-full h-full aspect-square">
        <span className={cn(
          "text-6xl font-bold timer-display transition-all",
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

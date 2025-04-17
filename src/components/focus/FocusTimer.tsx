import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { cn } from "@/lib/utils";
import { PlayIcon, PauseIcon } from "lucide-react";

interface FocusTimerProps {
  initialTime: number;
  isPaused: boolean;
  onComplete: () => void;
  onMilestoneReached: (milestone: number) => void;
  onProgressUpdate: (progress: number) => void;
  onTimerStart?: () => void; // Add this prop
  lowPowerMode?: boolean;
  className?: string;
}

interface FocusTimerHandle {
  stopTimer: () => void;
  setRemainingTime: (time: number) => void;
  getRemainingTime: () => number;
}

const FocusTimer = forwardRef<
  FocusTimerHandle,
  FocusTimerProps
>((props, ref) => {
  const { initialTime, isPaused, onComplete, onMilestoneReached, onProgressUpdate, lowPowerMode, className, onTimerStart } = props;
  const [remainingTime, setRemainingTimeState] = useState(initialTime);
  const [milestone, setMilestone] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  // Add a ref to track if timer has been started
  const timerStartedRef = useRef(false);

  const setRemainingTime = useCallback((time: number) => {
    setRemainingTimeState(time);
  }, []);

  const getRemainingTime = useCallback(() => {
    return remainingTime;
  }, [remainingTime]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
    endTimeRef.current = null;
  }, []);

  useImperativeHandle(ref, () => ({
    stopTimer,
    setRemainingTime,
    getRemainingTime
  }), [stopTimer, setRemainingTime, getRemainingTime]);

  // Milestone logic
  useEffect(() => {
    if (initialTime) {
      const milestone1 = initialTime * 0.25;
      const milestone2 = initialTime * 0.5;
      const milestone3 = initialTime * 0.75;

      if (remainingTime <= milestone1 && milestone < 1) {
        setMilestone(1);
        onMilestoneReached(1);
      } else if (remainingTime <= milestone2 && milestone < 2) {
        setMilestone(2);
        onMilestoneReached(2);
      } else if (remainingTime <= milestone3 && milestone < 3) {
        setMilestone(3);
        onMilestoneReached(3);
      }
    }
  }, [remainingTime, initialTime, milestone, onMilestoneReached]);

  // Reset timer when initialTime changes
  useEffect(() => {
    stopTimer();
    setRemainingTimeState(initialTime);
    setMilestone(0);
    timerStartedRef.current = false;
  }, [initialTime, stopTimer, setRemainingTimeState]);

  // Timer logic 
  useEffect(() => {
    if (!isPaused && remainingTime > 0 && !intervalRef.current) {
      if (!timerStartedRef.current && onTimerStart) {
        onTimerStart();
        timerStartedRef.current = true;
      }
      
      startTimeRef.current = performance.now();
      endTimeRef.current = startTimeRef.current + (remainingTime * 1000);

      intervalRef.current = window.setInterval(() => {
        setRemainingTimeState((prevTime) => {
          if (prevTime <= 1) {
            stopTimer();
            onComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      const updateProgress = () => {
        if (startTimeRef.current && endTimeRef.current) {
          const now = performance.now();
          const timePassed = now - startTimeRef.current;
          progressRef.current = Math.min(timePassed / (remainingTime * 1000), 1);
          onProgressUpdate(progressRef.current);
        }

        if (!isPaused && remainingTime > 0) {
          animationFrameRef.current = window.requestAnimationFrame(updateProgress);
        }
      };

      animationFrameRef.current = window.requestAnimationFrame(updateProgress);
    }
    
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPaused, remainingTime, initialTime, onComplete, onProgressUpdate, onTimerStart, stopTimer, setRemainingTimeState]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        className="absolute inset-0"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#E2E8F0"
          strokeWidth="4"
          fill="none"
          className={cn(lowPowerMode ? "opacity-50" : "opacity-100")}
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke="#7c3aed"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          style={{
            transformOrigin: "50% 50%",
            transform: "rotate(-90deg)",
          }}
          animate={{
            strokeDasharray: `${Math.PI * 2 * 45 * progressRef.current} ${Math.PI * 2 * 45}`,
          }}
          transition={{ linear: true, duration: 0.1, ease: "linear" }}
        />
      </svg>
      <span className="absolute text-2xl font-bold text-gray-800 dark:text-gray-200">{formatTime(remainingTime)}</span>
    </div>
  );
});

FocusTimer.displayName = "FocusTimer";

export default FocusTimer;

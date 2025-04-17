
import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface FocusTimerProps {
  initialTime: number;
  isPaused: boolean;
  onComplete: () => void;
  onMilestoneReached: (milestone: number) => void;
  onProgressUpdate: (progress: number) => void;
  lowPowerMode?: boolean;
  className?: string;
}

interface FocusTimerRef {
  stopTimer: () => void;
  setRemainingTime: (time: number) => void;
  getRemainingTime: () => number;
}

const FocusTimer = forwardRef<FocusTimerRef, FocusTimerProps>(
  ({ 
    initialTime, 
    isPaused, 
    onComplete, 
    onMilestoneReached,
    onProgressUpdate,
    lowPowerMode = false,
    className 
  }, ref) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [progress, setProgress] = useState(100);
    const [milestone, setMilestone] = useState(0);
    const [segment, setSegment] = useState(0);
    const [segmentProgress, setSegmentProgress] = useState(0);
    
    const timerRef = useRef<number>();
    const lastTickRef = useRef<number>(Date.now());
    const pausedTimeRef = useRef<number | null>(null);
    
    // Calculate derived values
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (progress / 100) * circumference;
    
    // Format time as MM:SS
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Calculate milestone and segment
    useEffect(() => {
      const segmentSize = initialTime / 3;
      const currentSegment = 3 - Math.floor(timeLeft / segmentSize);
      const validSegment = Math.max(0, Math.min(3, currentSegment));
      
      if (validSegment !== segment) {
        setSegment(validSegment);
      }
      
      if (validSegment > 0 && validSegment !== milestone) {
        setMilestone(validSegment);
        onMilestoneReached(validSegment);
      }
      
      // Calculate progress within the current segment (0-100)
      const remainingInSegment = timeLeft - (initialTime - validSegment * segmentSize);
      const segmentProgressValue = 100 - (remainingInSegment / segmentSize) * 100;
      const clampedSegmentProgress = Math.max(0, Math.min(100, segmentProgressValue));
      
      setSegmentProgress(clampedSegmentProgress);
      onProgressUpdate(clampedSegmentProgress);
    }, [timeLeft, initialTime, segment, milestone, onMilestoneReached, onProgressUpdate]);
    
    // Timer logic
    useEffect(() => {
      if (isPaused) {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          pausedTimeRef.current = Date.now();
        }
        return;
      } else if (pausedTimeRef.current) {
        // Adjust the lastTickRef when resuming
        const pauseDuration = Date.now() - pausedTimeRef.current;
        lastTickRef.current += pauseDuration;
        pausedTimeRef.current = null;
      }
      
      // Clear any existing timer
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      // Start a new timer
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const delta = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;
        
        setTimeLeft((prevTimeLeft) => {
          const newTimeLeft = Math.max(0, prevTimeLeft - delta);
          setProgress((newTimeLeft / initialTime) * 100);
          
          if (newTimeLeft <= 0) {
            if (timerRef.current) {
              window.clearInterval(timerRef.current);
            }
            onComplete();
          }
          
          return newTimeLeft;
        });
      }, 100);
      
      return () => {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }
      };
    }, [isPaused, initialTime, onComplete]);
    
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      stopTimer: () => {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }
      },
      setRemainingTime: (time: number) => {
        setTimeLeft(time);
        setProgress((time / initialTime) * 100);
      },
      getRemainingTime: () => timeLeft
    }));
    
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <svg
          className={cn(
            "w-full h-full origin-center -rotate-90 transform",
            lowPowerMode ? "animate-none" : ""
          )}
          viewBox="0 0 300 300"
        >
          {/* Background Circle */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            className="stroke-muted-foreground/20"
            strokeWidth="12"
            fill="none"
          />
          
          {/* Progress Circle */}
          <motion.circle
            cx="150"
            cy="150"
            r={radius}
            className="stroke-primary"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{
              type: "spring",
              stiffness: lowPowerMode ? 100 : 40,
              damping: lowPowerMode ? 20 : 8
            }}
          />
          
          {/* Milestone Markers */}
          {[1, 2, 3].map((ms) => {
            const angle = (ms / 3) * 360 - 90;
            const x = 150 + radius * Math.cos((angle * Math.PI) / 180);
            const y = 150 + radius * Math.sin((angle * Math.PI) / 180);
            
            return (
              <motion.circle
                key={ms}
                cx={x}
                cy={y}
                r={ms <= milestone ? 8 : 6}
                className={cn(
                  ms <= milestone
                    ? "fill-green-500 stroke-white"
                    : "fill-muted stroke-muted-foreground/30",
                  lowPowerMode ? "animate-none" : ""
                )}
                strokeWidth={ms <= milestone ? 3 : 2}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{
                  scale: ms <= milestone ? 1.1 : 0.9,
                  opacity: ms <= milestone ? 1 : 0.7,
                }}
                transition={{
                  type: "spring",
                  stiffness: lowPowerMode ? 100 : 400,
                  damping: lowPowerMode ? 15 : 10,
                }}
              />
            );
          })}
          
          {/* Small Markers */}
          {[...Array(12)].map((_, i) => {
            // Skip positions where milestone circles are
            if (i % 4 === 0) return null;
            
            const angle = (i / 12) * 360 - 90;
            const x = 150 + radius * Math.cos((angle * Math.PI) / 180);
            const y = 150 + radius * Math.sin((angle * Math.PI) / 180);
            
            const segmentIndex = Math.floor(i / 4);
            const isCompleted = segmentIndex < milestone;
            const isActive = segmentIndex === milestone - 1 || (milestone === 0 && segmentIndex === 0);
            
            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r={3}
                className={cn(
                  isCompleted
                    ? "fill-green-500"
                    : isActive
                    ? "fill-primary"
                    : "fill-muted-foreground/30"
                )}
                initial={{ scale: 0.8 }}
                animate={{ scale: isActive ? 1.2 : 1 }}
                transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, repeatType: "reverse" }}
              />
            );
          })}
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="timer-display text-4xl sm:text-5xl font-mono tabular-nums">
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-2">
            {segment === 0 && "Starting Focus Session"}
            {segment === 1 && "First Milestone Reached"}
            {segment === 2 && "Second Milestone Reached"}
            {segment === 3 && "Final Stretch!"}
          </div>
        </div>
      </div>
    );
  }
);

FocusTimer.displayName = "FocusTimer";

export default FocusTimer;

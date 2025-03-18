import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, StopCircle, ChevronUp, ChevronDown } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { toast } from "sonner";

interface FocusTimerProps {
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onMilestoneReached?: (milestone: number) => void;
  onProgressUpdate?: (progress: number) => void;
  isPaused: boolean;
  autoStart?: boolean;
  showControls?: boolean;
  onEndSessionClick?: () => void;
}

// Full session is 3 hours = 180 minutes
const TOTAL_SESSION_TIME = 180 * 60; // 3 hours in seconds
const MILESTONE_TIME = 45 * 60; // 45 minutes in seconds

export const FocusTimer = forwardRef<{ stopTimer: () => void }, FocusTimerProps>(({ 
  onPause, 
  onResume, 
  onComplete,
  onMilestoneReached,
  onProgressUpdate,
  isPaused,
  autoStart = false,
  showControls = true,
  onEndSessionClick
}: FocusTimerProps, ref) => {
  const { state } = useOnboarding();
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [time, setTime] = useState(minutes * 60 + seconds);
  const [progress, setProgress] = useState(100);
  const [isActive, setIsActive] = useState(false);
  const [milestoneReached, setMilestoneReached] = useState(0);
  const timerRef = useRef<number>();
  const notificationShownRef = useRef(false);
  const lastMilestoneTimeRef = useRef(0);
  const rafId = useRef<number | null>(null);
  
  // Calculate elapsed time based on the original time and current time
  // This is used for milestone tracking
  const initialTimeRef = useRef(0);
  const elapsedTimeRef = useRef(0);

  // Expose stopTimer method to parent component
  useImperativeHandle(ref, () => ({
    stopTimer: () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      setIsActive(false);
    }
  }));
  
  useEffect(() => {
    // Initialize with 45 minutes if auto-starting (default session segment)
    if (autoStart) {
      const initialMinutes = 45;
      setMinutes(initialMinutes);
      setSeconds(0);
      setTime(initialMinutes * 60);
      initialTimeRef.current = initialMinutes * 60;
    }
    
    const savedDuration = localStorage.getItem('focusTimerDuration');
    if (savedDuration) {
      try {
        const { minutes: savedMinutes, seconds: savedSeconds } = JSON.parse(savedDuration);
        setMinutes(savedMinutes);
        setSeconds(savedSeconds);
        setTime(savedMinutes * 60 + savedSeconds);
        initialTimeRef.current = savedMinutes * 60 + savedSeconds;
        localStorage.removeItem('focusTimerDuration');
      } catch (e) {
        console.error('Error parsing saved duration', e);
      }
    }
    
    if (autoStart) {
      // Use RAF for smoother animation and to prevent jank
      rafId.current = requestAnimationFrame(() => {
        setTimeout(() => {
          setIsActive(true);
          if (!notificationShownRef.current) {
            toast.success("Focus session started!");
            notificationShownRef.current = true;
          }
        }, 500);
      });
    }
    
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [autoStart]);
  
  const adjustTime = (type: 'minutes' | 'seconds', increment: boolean) => {
    if (isActive) return;
    
    if (type === 'minutes') {
      const newMinutes = increment ? minutes + 1 : minutes - 1;
      if (newMinutes >= 0 && newMinutes <= 45) {
        setMinutes(newMinutes);
        setTime(newMinutes * 60 + seconds);
      }
    } else {
      const newSeconds = increment ? seconds + 15 : seconds - 15;
      if (newSeconds >= 0 && newSeconds < 60) {
        setSeconds(newSeconds);
        setTime(minutes * 60 + newSeconds);
      }
    }
  };

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            elapsedTimeRef.current += initialTimeRef.current - 1;
            
            // Check if we've completed a milestone but not the full session
            const totalElapsedSeconds = elapsedTimeRef.current;
            const milestonesCompleted = Math.floor(totalElapsedSeconds / MILESTONE_TIME);
            
            if (milestonesCompleted < 4) { // Less than full session (3 hours = 4 milestones)
              // Start next milestone segment
              const newMilestone = milestonesCompleted;
              setMilestoneReached(newMilestone);
              
              if (newMilestone > 0 && onMilestoneReached) {
                // Use RAF for smoother UI updates
                requestAnimationFrame(() => {
                  onMilestoneReached(newMilestone);
                  
                  // Show milestone celebration
                  const milestoneMessages = [
                    "Great job! You've made it to the first checkpoint—keep going!",
                    "You're halfway up the mountain—stay focused!",
                    "Final push! Reach the peak and complete today's session!"
                  ];
                  
                  if (newMilestone <= milestoneMessages.length) {
                    setTimeout(() => {
                      toast.success(milestoneMessages[newMilestone - 1], {
                        duration: 5000,
                      });
                    }, 0);
                  }
                });
              }
              
              // If we've completed all milestones (3 hours)
              if (milestonesCompleted >= 3) {
                setTimeout(() => {
                  toast.success("Congratulations! You've completed your 3-hour focus session!", {
                    duration: 5000,
                  });
                  // Use setTimeout to prevent UI blocking
                  setTimeout(() => {
                    onComplete();
                  }, 0);
                }, 0);
                return 0;
              }
              
              // Start a new 45-minute segment
              const nextSegmentTime = 45 * 60;
              initialTimeRef.current = nextSegmentTime;
              return nextSegmentTime;
            } else {
              // Full session completed
              clearInterval(timerRef.current);
              setIsActive(false);
              // Use requestAnimationFrame to prevent UI blocking
              requestAnimationFrame(() => {
                setTimeout(() => {
                  onComplete();
                }, 0);
              });
              return 0;
            }
          }
          
          // Check for milestones during the timer countdown
          const currentElapsedTime = elapsedTimeRef.current + (initialTimeRef.current - prevTime);
          const currentMilestone = Math.floor(currentElapsedTime / MILESTONE_TIME);
          
          if (onProgressUpdate) {
            const segmentElapsedTime = currentElapsedTime % MILESTONE_TIME;
            const segmentProgress = (segmentElapsedTime / MILESTONE_TIME) * 100;
            // Use RAF to ensure smooth progress updates without jank
            if (rafId.current) {
              cancelAnimationFrame(rafId.current);
            }
            rafId.current = requestAnimationFrame(() => {
              onProgressUpdate(segmentProgress);
              rafId.current = null;
            });
          }
          
          if (currentMilestone > milestoneReached && currentMilestone <= 3) {
            setMilestoneReached(currentMilestone);
            
            if (onMilestoneReached) {
              // Use RAF to keep UI responsive
              requestAnimationFrame(() => {
                onMilestoneReached(currentMilestone);
                
                // Show milestone celebration
                const milestoneMessages = [
                  "Great job! You've made it to the first checkpoint—keep going!",
                  "You're halfway up the mountain—stay focused!",
                  "Final push! Reach the peak and complete today's session!"
                ];
                
                if (currentMilestone <= milestoneMessages.length) {
                  setTimeout(() => {
                    toast.success(milestoneMessages[currentMilestone - 1], {
                      duration: 5000,
                    });
                  }, 0);
                }
              });
            }
          }
          
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [isActive, isPaused, onComplete, onMilestoneReached, milestoneReached, onProgressUpdate]);
  
  useEffect(() => {
    const totalTime = minutes * 60 + seconds;
    setProgress((time / totalTime) * 100);
  }, [time, minutes, seconds]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleStart = () => {
    if (time === 0) return;
    setIsActive(true);
    initialTimeRef.current = time;
    if (!notificationShownRef.current) {
      toast.success("Focus session started!");
      notificationShownRef.current = true;
    }
  };
  
  const handlePause = () => {
    setIsActive(false);
    onPause();
  };
  
  const handleResume = () => {
    setIsActive(true);
    onResume();
  };

  const handleEndSessionClick = () => {
    if (time > 0 && isActive) {
      if (onEndSessionClick) {
        // Use requestAnimationFrame to prevent UI blocking
        requestAnimationFrame(() => {
          setTimeout(() => {
            onEndSessionClick();
          }, 0);
        });
      } else {
        // In case there's no external handler, directly call onComplete
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = undefined;
        }
        setIsActive(false);
        // Use setTimeout to prevent UI freezing
        setTimeout(() => {
          onComplete();
        }, 0);
      }
    } else {
      // Use setTimeout to prevent UI freezing
      setTimeout(() => {
        onComplete();
      }, 0);
    }
  };

  // Calculate the overall session progress (out of 3 hours)
  const calculateOverallProgress = () => {
    const completedTime = elapsedTimeRef.current + (initialTimeRef.current - time);
    return Math.min((completedTime / TOTAL_SESSION_TIME) * 100, 100);
  };
  
  return (
    <Card className="p-6 w-full max-w-md">
      <div className="flex flex-col items-center space-y-4">
        {showControls ? (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => adjustTime('minutes', true)}
                disabled={isActive || minutes >= 45}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <div className="text-4xl font-mono tabular-nums w-20 text-center">
                {minutes.toString().padStart(2, '0')}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => adjustTime('minutes', false)}
                disabled={isActive || minutes <= 0}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-4xl">:</span>
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => adjustTime('seconds', true)}
                disabled={isActive || seconds >= 45}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <div className="text-4xl font-mono tabular-nums w-20 text-center">
                {seconds.toString().padStart(2, '0')}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => adjustTime('seconds', false)}
                disabled={isActive || seconds <= 0}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-4xl font-mono tabular-nums">
            {formatTime(time)}
          </div>
        )}
        
        {/* Current segment progress */}
        <Progress value={progress} className="w-full" />
        
        <div className="flex gap-4">
          {!isActive ? (
            <Button onClick={handleStart} size="lg" disabled={time === 0}>
              <Play className="mr-2 h-5 w-5" />
              Start Session
            </Button>
          ) : isPaused ? (
            <Button onClick={handleResume} size="lg" variant="outline">
              <Play className="mr-2 h-5 w-5" />
              Resume
            </Button>
          ) : (
            <Button onClick={handlePause} size="lg" variant="outline">
              <Pause className="mr-2 h-5 w-5" />
              Pause
            </Button>
          )}
          
          {isActive && (
            <Button 
              onClick={handleEndSessionClick} 
              size="lg"
              variant="ghost"
            >
              <StopCircle className="mr-2 h-5 w-5" />
              End Session
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
});

FocusTimer.displayName = "FocusTimer";

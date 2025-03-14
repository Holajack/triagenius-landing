
import { useState, useEffect, useRef } from "react";
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
  isPaused: boolean;
  autoStart?: boolean;
  showControls?: boolean;
}

export const FocusTimer = ({ 
  onPause, 
  onResume, 
  onComplete, 
  isPaused,
  autoStart = false,
  showControls = true
}: FocusTimerProps) => {
  const { state } = useOnboarding();
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [time, setTime] = useState(minutes * 60 + seconds);
  const [progress, setProgress] = useState(100);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<number>();
  const notificationShownRef = useRef(false);
  
  useEffect(() => {
    const savedDuration = localStorage.getItem('focusTimerDuration');
    if (savedDuration) {
      try {
        const { minutes: savedMinutes, seconds: savedSeconds } = JSON.parse(savedDuration);
        setMinutes(savedMinutes);
        setSeconds(savedSeconds);
        setTime(savedMinutes * 60 + savedSeconds);
        localStorage.removeItem('focusTimerDuration');
      } catch (e) {
        console.error('Error parsing saved duration', e);
      }
    }
    
    // Auto-start timer if specified
    if (autoStart) {
      setTimeout(() => {
        setIsActive(true);
        // Only show notification if it hasn't been shown yet
        if (!notificationShownRef.current) {
          toast.success("Focus session started!");
          notificationShownRef.current = true;
        }
      }, 500);
    }
  }, [autoStart]);
  
  const adjustTime = (type: 'minutes' | 'seconds', increment: boolean) => {
    if (isActive) return; // Don't allow changes while timer is running

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
            setIsActive(false);
            onComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, onComplete]);
  
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
              onClick={onComplete} 
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
};

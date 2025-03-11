
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, StopCircle } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { toast } from "sonner";

interface FocusTimerProps {
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  isPaused: boolean;
}

export const FocusTimer = ({ onPause, onResume, onComplete, isPaused }: FocusTimerProps) => {
  const { state } = useOnboarding();
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [progress, setProgress] = useState(100);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<number>();
  
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
    const totalTime = 25 * 60;
    setProgress((time / totalTime) * 100);
  }, [time]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleStart = () => {
    setIsActive(true);
    toast.success("Focus session started!");
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
        <div className="text-4xl font-mono tabular-nums">
          {formatTime(time)}
        </div>
        
        <Progress value={progress} className="w-full" />
        
        <div className="flex gap-4">
          {!isActive ? (
            <Button onClick={handleStart} size="lg">
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


import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PauseCircle, PlayCircle, Settings, TimerReset } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const QuickStartButton = () => {
  const { state } = useOnboarding();
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(25 * 60); // 25 minutes in seconds
  
  // Get environment-specific gradient class
  const getGradientClass = () => {
    switch (state.environment) {
      case 'office': return "from-blue-50 to-indigo-100";
      case 'park': return "from-green-50 to-emerald-100";
      case 'home': return "from-amber-50 to-orange-100";
      case 'coffee-shop': return "from-amber-100 to-yellow-100";
      case 'library': return "from-slate-100 to-gray-100";
      default: return "from-purple-50 to-indigo-100";
    }
  };
  
  // Get accent color based on environment
  const getAccentColor = () => {
    switch (state.environment) {
      case 'office': return "text-blue-600 bg-blue-50";
      case 'park': return "text-green-600 bg-green-50";
      case 'home': return "text-orange-600 bg-orange-50";
      case 'coffee-shop': return "text-amber-600 bg-amber-50";
      case 'library': return "text-gray-600 bg-gray-50";
      default: return "text-purple-600 bg-purple-50";
    }
  };
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const startSession = () => {
    setIsActive(true);
    toast.success("Focus session started!", {
      description: `Your ${state.workStyle === 'pomodoro' ? 'Pomodoro' : 'Focus'} timer has begun.`,
    });
  };
  
  const pauseSession = () => {
    setIsActive(false);
    toast.info("Session paused", {
      description: "Take a moment when you need it.",
    });
  };
  
  const resetSession = () => {
    setIsActive(false);
    setTimer(25 * 60);
    toast.info("Session reset", {
      description: "Timer has been reset to 25 minutes.",
    });
  };
  
  return (
    <Card className={cn("overflow-hidden", isActive ? "border-triage-purple shadow-md" : "")}>
      <div className={cn("bg-gradient-to-r p-6", getGradientClass())}>
        <h3 className="text-lg font-semibold mb-1">Ready to focus?</h3>
        <p className="text-sm text-gray-600">Start a quick session based on your preferences</p>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="flex flex-col items-center">
            <div className={cn("p-2 rounded-full", getAccentColor())}>
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-xs mt-1">Settings</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold tabular-nums">
              {formatTime(timer)}
            </div>
            <span className="text-xs mt-1">
              {state.workStyle === 'pomodoro' ? 'Pomodoro' : 'Focus'} Timer
            </span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className={cn("p-2 rounded-full", getAccentColor())}>
              <TimerReset onClick={resetSession} className="w-5 h-5 cursor-pointer" />
            </div>
            <span className="text-xs mt-1">Reset</span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        {isActive ? (
          <Button 
            onClick={pauseSession}
            className="w-full bg-triage-purple hover:bg-triage-purple/90 text-white"
            size="lg"
          >
            <PauseCircle className="w-5 h-5 mr-2" /> Pause Session
          </Button>
        ) : (
          <Button 
            onClick={startSession}
            className="w-full bg-triage-purple hover:bg-triage-purple/90 text-white"
            size="lg"
          >
            <PlayCircle className="w-5 h-5 mr-2" /> Start Focus Session
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickStartButton;

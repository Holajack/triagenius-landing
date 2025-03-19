import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PauseCircle, PlayCircle, Settings, TimerReset, ChevronUp, ChevronDown, BookOpen } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import TaskSelectionDialog, { SelectedTaskData } from "@/components/focus/TaskSelectionDialog";

const QuickStartButton = () => {
  const { state } = useOnboarding();
  const [isActive, setIsActive] = useState(false);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [timer, setTimer] = useState(minutes * 60 + seconds);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showTaskSelection, setShowTaskSelection] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<SelectedTaskData | null>(null);
  
  const navigate = useNavigate();
  
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
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const startSession = () => {
    localStorage.setItem('focusTimerDuration', JSON.stringify({ minutes, seconds }));
    
    setIsActive(true);
    navigate("/focus-session");
  };
  
  const pauseSession = () => {
    setIsActive(false);
    toast.info("Session paused", {
      description: "Take a moment when you need it.",
    });
  };
  
  const resetSession = () => {
    setIsActive(false);
    setMinutes(25);
    setSeconds(0);
    setTimer(25 * 60);
    toast.info("Session reset", {
      description: "Timer has been reset to 25 minutes.",
    });
  };
  
  const toggleAdjust = () => {
    setShowAdjust(!showAdjust);
  };
  
  const adjustTime = (type: 'minutes' | 'seconds', increment: boolean) => {
    if (isActive) return;
    
    if (type === 'minutes') {
      const newMinutes = increment ? minutes + 1 : minutes - 1;
      if (newMinutes >= 0 && newMinutes <= 45) {
        setMinutes(newMinutes);
        setTimer(newMinutes * 60 + seconds);
      }
    } else {
      const newSeconds = increment ? seconds + 15 : seconds - 15;
      if (newSeconds >= 0 && newSeconds < 60) {
        setSeconds(newSeconds);
        setTimer(minutes * 60 + newSeconds);
      }
    }
  };
  
  const handleTaskSelectionConfirm = (data: SelectedTaskData) => {
    setSelectedTasks(data);
    toast.success(
      data.tasks.length > 0 
        ? `Selected ${data.tasks.length} task(s) for your focus session` 
        : "No tasks selected for this session"
    );
  };
  
  return (
    <Card className={cn("overflow-hidden", isActive ? "border-triage-purple shadow-md" : "")}>
      <div className={cn("bg-gradient-to-r p-6", getGradientClass())}>
        <h3 className="text-lg font-semibold mb-1">Ready to focus?</h3>
        <p className="text-sm text-gray-600">Start a quick session based on your preferences</p>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="flex flex-col items-center cursor-pointer" onClick={() => setShowTaskSelection(true)}>
            <div className={cn("p-2 rounded-full", getAccentColor())}>
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs mt-1">
              {selectedTasks && selectedTasks.tasks.length > 0 
                ? `${selectedTasks.tasks.length} Task${selectedTasks.tasks.length > 1 ? 's' : ''}` 
                : "Select Tasks"}
            </span>
          </div>
          
          <div className="flex flex-col items-center cursor-pointer" onClick={toggleAdjust}>
            <div className={cn("p-2 rounded-full", getAccentColor())}>
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-xs mt-1">Settings</span>
          </div>
          
          {showAdjust ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 p-0"
                  onClick={() => adjustTime('minutes', true)}
                  disabled={minutes >= 45}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="text-xl font-mono tabular-nums w-10 text-center">
                  {minutes.toString().padStart(2, '0')}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 p-0"
                  onClick={() => adjustTime('minutes', false)}
                  disabled={minutes <= 0}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-xl">:</span>
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 p-0" 
                  onClick={() => adjustTime('seconds', true)}
                  disabled={seconds >= 45}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="text-xl font-mono tabular-nums w-10 text-center">
                  {seconds.toString().padStart(2, '0')}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 p-0"
                  onClick={() => adjustTime('seconds', false)}
                  disabled={seconds <= 0}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold tabular-nums">
                {formatTime(timer)}
              </div>
              <span className="text-xs mt-1">
                {state.workStyle === 'pomodoro' ? 'Sprints' : state.workStyle === 'deep-work' ? 'Deep Work' : 'Balanced'} Timer
              </span>
            </div>
          )}
          
          <div className="flex flex-col items-center">
            <div className={cn("p-2 rounded-full cursor-pointer", getAccentColor())}>
              <TimerReset onClick={resetSession} className="w-5 h-5" />
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

      <TaskSelectionDialog 
        open={showTaskSelection} 
        onOpenChange={setShowTaskSelection}
        onConfirm={handleTaskSelectionConfirm}
      />
    </Card>
  );
};

export default QuickStartButton;

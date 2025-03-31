import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PauseCircle, PlayCircle, BookOpen } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTasks } from "@/contexts/TaskContext";
import { Task } from "@/types/tasks";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import TaskSelectionFlow from "../focus/TaskSelectionFlow";

const QuickStartButton = () => {
  const { state } = useOnboarding();
  const [isActive, setIsActive] = useState(false);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [timer, setTimer] = useState(minutes * 60 + seconds);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [showTaskSelectionFlow, setShowTaskSelectionFlow] = useState(false);
  const [useAutoPriority, setUseAutoPriority] = useState<boolean | null>(null);
  const [taskPriorities, setTaskPriorities] = useState<string[]>([]);
  
  const navigate = useNavigate();
  const { state: taskState } = useTasks();
  
  useEffect(() => {
    if (state.workStyle) {
      switch (state.workStyle) {
        case 'pomodoro': // Sprints
          setMinutes(25);
          setSeconds(0);
          break;
        case 'deep-work': // Deep Work
          setMinutes(45);
          setSeconds(0);
          break;
        case 'balanced': // Balanced
          setMinutes(45);
          setSeconds(0);
          break;
        default:
          setMinutes(25);
          setSeconds(0);
      }
    }
    
    setTimer(minutes * 60 + seconds);
  }, [state.workStyle, minutes, seconds]);
  
  const getGradientClass = () => {
    switch (state.environment) {
      case 'office': return "from-blue-100 to-blue-50";
      case 'park': return "from-green-100 to-emerald-50";
      case 'home': return "from-orange-100 to-amber-50";
      case 'coffee-shop': return "from-amber-100 to-yellow-50";
      case 'library': return "from-slate-100 to-gray-50";
      default: return "from-purple-100 to-indigo-50";
    }
  };
  
  const getAccentColor = () => {
    switch (state.environment) {
      case 'office': return "text-blue-600 bg-blue-100";
      case 'park': return "text-green-700 bg-green-100";
      case 'home': return "text-orange-600 bg-orange-100";
      case 'coffee-shop': return "text-amber-800 bg-amber-100";
      case 'library': return "text-gray-600 bg-gray-100";
      default: return "text-purple-600 bg-purple-100";
    }
  };
  
  const getPrimaryButtonColor = () => {
    switch (state.environment) {
      case 'office': return "bg-blue-600 hover:bg-blue-700";
      case 'park': return "bg-green-700 hover:bg-green-800";
      case 'home': return "bg-orange-500 hover:bg-orange-600";
      case 'coffee-shop': return "bg-amber-700 hover:bg-amber-800";
      case 'library': return "bg-gray-600 hover:bg-gray-700";
      default: return "bg-triage-purple hover:bg-triage-purple/90";
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreakTime = () => {
    switch (state.workStyle) {
      case 'pomodoro': // Sprints
        return 5;
      case 'deep-work': // Deep Work
        return 10;
      case 'balanced': // Balanced
        return 15;
      default:
        return 5;
    }
  };
  
  const groupTasksByPriority = (tasks: Task[]): Task[] => {
    const highPriorityTasks = tasks.filter(task => task.priority === 'high');
    const mediumPriorityTasks = tasks.filter(task => task.priority === 'medium');
    const lowPriorityTasks = tasks.filter(task => task.priority === 'low');
    
    return [...highPriorityTasks, ...mediumPriorityTasks, ...lowPriorityTasks];
  };
  
  const prepareFocusTasks = () => {
    if (useAutoPriority === true) {
      const prioritizedTasks = groupTasksByPriority(taskState.tasks);
      const taskPriorityData = prioritizedTasks.map(task => task.id);
      
      console.log("Tasks ordered by priority:", prioritizedTasks.map(t => `${t.title} (${t.priority})`));
      
      localStorage.setItem('focusTaskPriority', JSON.stringify(taskPriorityData));
      
      const selectedTasksData = {
        tasks: prioritizedTasks.map(task => ({
          taskId: task.id,
          title: task.title,
          subtasks: task.subtasks.map(subtask => ({
            subtaskId: subtask.id,
            title: subtask.title
          }))
        }))
      };
      
      localStorage.setItem('selectedTasksForFocus', JSON.stringify(selectedTasksData));
      
      localStorage.setItem('priorityMode', 'auto');
      
      return true;
    }
    
    return false;
  };
  
  const startSession = () => {
    localStorage.setItem('focusTimerDuration', JSON.stringify({ 
      minutes, 
      seconds,
      breakMinutes: getBreakTime(),
      workStyle: state.workStyle
    }));
    
    if (taskState.tasks.length > 0 && useAutoPriority === null) {
      setShowPriorityDialog(true);
      return;
    }
    
    if (useAutoPriority === true) {
      prepareFocusTasks();
      setIsActive(true);
      navigate("/focus-session");
    } else {
      setShowTaskSelectionFlow(true);
    }
  };
  
  const pauseSession = () => {
    setIsActive(false);
    toast.info("Session paused", {
      description: "Take a moment when you need it.",
    });
  };
  
  const handleAutoPriorityConfirm = () => {
    setUseAutoPriority(true);
    setShowPriorityDialog(false);
    
    prepareFocusTasks();
    
    localStorage.setItem('autoStartFocusTimer', 'true');
    localStorage.setItem('priorityMode', 'auto');
    
    navigate("/focus-session");
  };
  
  const handleCustomPrioritySelect = () => {
    setUseAutoPriority(false);
    setShowPriorityDialog(false);
    
    localStorage.setItem('priorityMode', 'custom');
    
    setShowTaskSelectionFlow(true);
  };
  
  return (
    <>
      <Card className={cn(
        "overflow-hidden border-2", 
        isActive ? "shadow-md" : "",
        state.environment === 'office' ? "border-blue-200" :
        state.environment === 'park' ? "border-green-600" :
        state.environment === 'home' ? "border-orange-300" :
        state.environment === 'coffee-shop' ? "border-amber-700" :
        state.environment === 'library' ? "border-gray-200" :
        "border-purple-200"
      )}>
        <div className={cn("bg-gradient-to-r p-6", getGradientClass())}>
          <h3 className="text-lg font-semibold mb-1">Ready to focus?</h3>
          <p className="text-sm text-gray-600">
            {state.workStyle === 'pomodoro' 
              ? 'Quick sprint sessions with short breaks (25min/5min)'
              : state.workStyle === 'deep-work'
              ? 'Extended focus periods with moderate breaks (45min/10min)'
              : 'Balanced work and rest cycles (45min/15min)'}
          </p>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="flex flex-col items-center">
              <div className={cn("p-2 rounded-full", getAccentColor())}>
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs mt-1">
                {taskState.tasks.length > 0 
                  ? `${taskState.tasks.length} Task${taskState.tasks.length > 1 ? 's' : ''}` 
                  : "No Tasks"}
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold tabular-nums">
                {formatTime(timer)}
              </div>
              <span className="text-xs mt-1">
                {state.workStyle === 'pomodoro' ? 'Sprints' : state.workStyle === 'deep-work' ? 'Deep Work' : 'Balanced'} Timer
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={cn("p-2 rounded-full", getAccentColor())}>
                <span className="font-medium text-sm">
                  {getBreakTime()}m
                </span>
              </div>
              <span className="text-xs mt-1">Break</span>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          {isActive ? (
            <Button 
              onClick={pauseSession}
              className={`w-full ${getPrimaryButtonColor()} text-white`}
              size="lg"
            >
              <PauseCircle className="w-5 h-5 mr-2" /> Pause Session
            </Button>
          ) : (
            <Button 
              onClick={startSession}
              className={`w-full ${getPrimaryButtonColor()} text-white`}
              size="lg"
            >
              <PlayCircle className="w-5 h-5 mr-2" /> Start Focus Session
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <DialogContent>
          <DialogTitle>Task Priority</DialogTitle>
          <DialogDescription>
            Would you like to automatically prioritize tasks based on their priority level, or would you prefer to create your own order?
          </DialogDescription>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleCustomPrioritySelect}
              className="sm:flex-1"
            >
              Create My Own Order
            </Button>
            <Button 
              onClick={handleAutoPriorityConfirm}
              className="sm:flex-1"
            >
              Use Automatic Priority
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskSelectionFlow 
        open={showTaskSelectionFlow} 
        onOpenChange={setShowTaskSelectionFlow} 
      />
    </>
  );
};

export default QuickStartButton;

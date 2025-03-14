
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTasks } from "@/contexts/TaskContext";
import { Task, SubTask } from "@/types/tasks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight } from "lucide-react";

interface TaskSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedTasks: string[], selectedSubtasks: Record<string, string[]>) => void;
}

const TaskSelectionDialog = ({ open, onOpenChange, onConfirm }: TaskSelectionDialogProps) => {
  const { state } = useTasks();
  const [selectedTasks, setSelectedTasks] = React.useState<string[]>([]);
  const [selectedSubtasks, setSelectedSubtasks] = React.useState<Record<string, string[]>>({});

  // Reset selections when dialog opens
  React.useEffect(() => {
    if (open) {
      // Get previously saved selections from localStorage
      try {
        const savedSelections = localStorage.getItem('focusSessionTasks');
        if (savedSelections) {
          const { tasks, subtasks } = JSON.parse(savedSelections);
          setSelectedTasks(tasks || []);
          setSelectedSubtasks(subtasks || {});
        }
      } catch (error) {
        console.error("Error loading saved task selections:", error);
        setSelectedTasks([]);
        setSelectedSubtasks({});
      }
    }
  }, [open]);

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        // Also remove all subtasks when deselecting a task
        setSelectedSubtasks(prevSubtasks => {
          const updated = { ...prevSubtasks };
          delete updated[taskId];
          return updated;
        });
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setSelectedSubtasks(prev => {
      const taskSubtasks = prev[taskId] || [];
      const updated = { ...prev };
      
      if (taskSubtasks.includes(subtaskId)) {
        updated[taskId] = taskSubtasks.filter(id => id !== subtaskId);
      } else {
        updated[taskId] = [...taskSubtasks, subtaskId];
        
        // Make sure the parent task is also selected
        if (!selectedTasks.includes(taskId)) {
          setSelectedTasks(prevTasks => [...prevTasks, taskId]);
        }
      }
      
      return updated;
    });
  };

  const handleConfirm = () => {
    // Save selections to localStorage
    localStorage.setItem('focusSessionTasks', JSON.stringify({
      tasks: selectedTasks,
      subtasks: selectedSubtasks
    }));
    
    onConfirm(selectedTasks, selectedSubtasks);
    onOpenChange(false);
  };

  const isTaskSelected = (taskId: string) => selectedTasks.includes(taskId);
  
  const isSubtaskSelected = (taskId: string, subtaskId: string) => {
    const taskSubtasks = selectedSubtasks[taskId] || [];
    return taskSubtasks.includes(subtaskId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Focus Tasks</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <ScrollArea className="h-[300px] pr-4">
            {state.tasks.length > 0 ? (
              <div className="space-y-4">
                {state.tasks.map((task: Task) => (
                  <div key={task.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`task-${task.id}`}
                        checked={isTaskSelected(task.id)}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                      <label
                        htmlFor={`task-${task.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {task.title}
                      </label>
                    </div>
                    
                    {task.subtasks.length > 0 && isTaskSelected(task.id) && (
                      <div className="pl-6 space-y-1 mt-1">
                        {task.subtasks.map((subtask: SubTask) => (
                          <div key={subtask.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`subtask-${subtask.id}`}
                              checked={isSubtaskSelected(task.id, subtask.id)}
                              onCheckedChange={() => toggleSubtask(task.id, subtask.id)}
                            />
                            <label
                              htmlFor={`subtask-${subtask.id}`}
                              className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {subtask.title}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks available. Add tasks from the dashboard first.
              </p>
            )}
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-triage-purple hover:bg-triage-purple/90" onClick={handleConfirm}>
            Start Session <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskSelectionDialog;

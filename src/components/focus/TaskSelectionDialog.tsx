
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTasks } from "@/contexts/TaskContext";
import { Task, SubTask } from "@/types/tasks";
import { Check, ClipboardList } from "lucide-react";

interface TaskSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedTasks: SelectedTaskData) => void;
}

export interface SelectedTaskData {
  tasks: {
    taskId: string;
    title: string;
    subtasks: {
      subtaskId: string;
      title: string;
    }[];
  }[];
}

export const TaskSelectionDialog = ({ open, onOpenChange, onConfirm }: TaskSelectionDialogProps) => {
  const { state } = useTasks();
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
  const [selectedSubtasks, setSelectedSubtasks] = useState<Record<string, boolean>>({});

  // Check if any tasks/subtasks were previously selected
  useEffect(() => {
    try {
      const savedSelection = localStorage.getItem('selectedTasksForFocus');
      if (savedSelection) {
        const parsedData: SelectedTaskData = JSON.parse(savedSelection);
        
        // Reconstruct selection state from saved data
        const taskSelections: Record<string, boolean> = {};
        const subtaskSelections: Record<string, boolean> = {};
        
        parsedData.tasks.forEach(task => {
          taskSelections[task.taskId] = true;
          task.subtasks.forEach(subtask => {
            subtaskSelections[`${task.taskId}-${subtask.subtaskId}`] = true;
          });
        });
        
        setSelectedTasks(taskSelections);
        setSelectedSubtasks(subtaskSelections);
      }
    } catch (error) {
      console.error("Error loading saved task selections:", error);
    }
  }, [open]);

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    setSelectedTasks(prev => ({
      ...prev,
      [taskId]: checked
    }));

    // If unchecking a task, also uncheck all its subtasks
    if (!checked) {
      const newSubtaskSelections = { ...selectedSubtasks };
      const task = state.tasks.find(t => t.id === taskId);
      
      if (task) {
        task.subtasks.forEach(subtask => {
          const key = `${taskId}-${subtask.id}`;
          newSubtaskSelections[key] = false;
        });
        setSelectedSubtasks(newSubtaskSelections);
      }
    }
  };

  const handleSubtaskSelection = (taskId: string, subtaskId: string, checked: boolean) => {
    const key = `${taskId}-${subtaskId}`;
    setSelectedSubtasks(prev => ({
      ...prev,
      [key]: checked
    }));

    // If checking a subtask, also check its parent task
    if (checked) {
      setSelectedTasks(prev => ({
        ...prev,
        [taskId]: true
      }));
    }
  };

  const handleConfirm = () => {
    // Create data structure for selected tasks and subtasks
    const data: SelectedTaskData = {
      tasks: []
    };

    state.tasks.forEach(task => {
      if (selectedTasks[task.id]) {
        const selectedTaskData = {
          taskId: task.id,
          title: task.title,
          subtasks: [] as { subtaskId: string; title: string }[]
        };

        task.subtasks.forEach(subtask => {
          const key = `${task.id}-${subtask.id}`;
          if (selectedSubtasks[key]) {
            selectedTaskData.subtasks.push({
              subtaskId: subtask.id,
              title: subtask.title
            });
          }
        });

        data.tasks.push(selectedTaskData);
      }
    });

    // Save to localStorage
    localStorage.setItem('selectedTasksForFocus', JSON.stringify(data));
    
    onConfirm(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Select Tasks for Focus Session
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Choose the subjects and specific topics you want to focus on during this session.
          </p>
          
          {state.tasks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No tasks available. Add tasks from the dashboard first.
            </div>
          ) : (
            <div className="space-y-4">
              {state.tasks.map((task) => (
                <div key={task.id} className="border rounded-md p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={selectedTasks[task.id] || false}
                      onCheckedChange={(checked) => 
                        handleTaskSelection(task.id, checked === true)
                      }
                    />
                    <label
                      htmlFor={`task-${task.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {task.title}
                    </label>
                  </div>
                  
                  {task.subtasks.length > 0 && (
                    <div className="pl-6 space-y-2 mt-2">
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`subtask-${task.id}-${subtask.id}`}
                            checked={selectedSubtasks[`${task.id}-${subtask.id}`] || false}
                            onCheckedChange={(checked) => 
                              handleSubtaskSelection(task.id, subtask.id, checked === true)
                            }
                            disabled={!selectedTasks[task.id]}
                          />
                          <label
                            htmlFor={`subtask-${task.id}-${subtask.id}`}
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
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={handleConfirm} className="w-full sm:w-auto">
            <Check className="h-4 w-4 mr-2" />
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskSelectionDialog;

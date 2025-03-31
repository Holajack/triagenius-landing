
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTasks } from "@/contexts/TaskContext";
import { Task } from "@/types/tasks";
import { Check, ClipboardList, GripVertical, ArrowDown, ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface TaskSelectionFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const TaskSelectionFlow = ({ open, onOpenChange }: TaskSelectionFlowProps) => {
  const { state } = useTasks();
  const navigate = useNavigate();
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
  const [selectedSubtasks, setSelectedSubtasks] = useState<Record<string, boolean>>({});
  const [taskOrder, setTaskOrder] = useState<string[]>([]);
  
  useEffect(() => {
    if (open) {
      // Reset selection state when dialog opens
      setSelectedTasks({});
      setSelectedSubtasks({});
      setTaskOrder([]);
    }
  }, [open]);

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    setSelectedTasks(prev => ({
      ...prev,
      [taskId]: checked
    }));

    // Add or remove task from order
    if (checked && !taskOrder.includes(taskId)) {
      setTaskOrder([...taskOrder, taskId]);
    } else if (!checked) {
      setTaskOrder(taskOrder.filter(id => id !== taskId));
      
      // Also uncheck all subtasks
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
    if (checked && !selectedTasks[taskId]) {
      handleTaskSelection(taskId, true);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(taskOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setTaskOrder(items);
  };

  const moveTaskUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...taskOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setTaskOrder(newOrder);
  };

  const moveTaskDown = (index: number) => {
    if (index >= taskOrder.length - 1) return;
    const newOrder = [...taskOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setTaskOrder(newOrder);
  };

  const handleConfirm = () => {
    // Filter ordered tasks to only include selected ones
    const orderedSelectedTasks = taskOrder.filter(id => selectedTasks[id]);
    
    if (orderedSelectedTasks.length === 0) {
      toast.error("Please select at least one task");
      return;
    }
    
    // Create data structure for selected tasks and subtasks
    const data: SelectedTaskData = {
      tasks: []
    };

    orderedSelectedTasks.forEach(taskId => {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
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

    // Save to localStorage for focus session to use
    localStorage.setItem('focusTaskPriority', JSON.stringify(orderedSelectedTasks));
    localStorage.setItem('selectedTasksForFocus', JSON.stringify(data));
    
    // Close the dialog and navigate to focus session
    onOpenChange(false);
    navigate("/focus-session");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Select and Order Tasks for Focus Session
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Choose the tasks you want to focus on and arrange them in your preferred order.
          </p>
          
          {state.tasks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No tasks available. Add tasks from the dashboard first.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Task selection section */}
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

              {/* Task order section */}
              {taskOrder.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">Task Order:</h3>
                  <div className="space-y-2">
                    {taskOrder.map((taskId, index) => {
                      const task = state.tasks.find(t => t.id === taskId);
                      if (!task || !selectedTasks[taskId]) return null;
                      
                      return (
                        <div key={taskId} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          <span className="flex-1 text-sm">{task.title}</span>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => moveTaskUp(index)}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => moveTaskDown(index)}
                              disabled={index === taskOrder.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={taskOrder.filter(id => selectedTasks[id]).length === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Start Focus Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskSelectionFlow;

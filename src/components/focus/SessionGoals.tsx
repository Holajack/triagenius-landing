import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useTasks } from "@/contexts/TaskContext";
import { Task, SubTask } from "@/types/tasks";

interface SessionGoalsProps {
  className?: string;
}

const SessionGoals = () => {
  const { state: taskState, dispatch } = useTasks();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedSubtasks, setSelectedSubtasks] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // Load selected tasks from localStorage
    try {
      const savedSelections = localStorage.getItem('focusSessionTasks');
      if (savedSelections) {
        const { tasks, subtasks } = JSON.parse(savedSelections);
        setSelectedTasks(tasks || []);
        setSelectedSubtasks(subtasks || {});
      }
    } catch (error) {
      console.error("Error loading saved task selections:", error);
    }
  }, []);
  
  // Filter tasks based on selections
  const filteredTasks = taskState.tasks.filter(task => 
    selectedTasks.length === 0 || selectedTasks.includes(task.id)
  );
  
  const getFilteredSubtasks = (taskId: string, subtasks: SubTask[]) => {
    if (!selectedTasks.includes(taskId)) return [];
    if (!selectedSubtasks[taskId] || selectedSubtasks[taskId].length === 0) return subtasks;
    return subtasks.filter(subtask => selectedSubtasks[taskId].includes(subtask.id));
  };

  const handleTaskToggle = (taskId: string) => {
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        taskId: taskId,
        completed: !taskState.tasks.find(task => task.id === taskId)?.completed
      }
    });
  };

  const handleSubtaskToggle = (taskId: string, subtaskId: string) => {
    dispatch({
      type: 'TOGGLE_SUBTASK',
      payload: {
        taskId: taskId,
        subtaskId: subtaskId
      }
    });
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-4">Session Goals</h2>
        
        <div className="space-y-4 mt-4">
          {/* Display session goals and tasks */}
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task: Task) => {
              const filteredSubtasks = getFilteredSubtasks(task.id, task.subtasks);
              return (
                <div key={task.id} className="rounded-lg border border-border p-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Checkbox 
                      checked={task.completed} 
                      onCheckedChange={() => handleTaskToggle(task.id)}
                      className="mr-2"
                    />
                    {task.title}
                  </h3>
                  
                  {filteredSubtasks.length > 0 && (
                    <div className="pl-6 space-y-2 mt-2">
                      {filteredSubtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center text-sm">
                          <Checkbox 
                            checked={subtask.completed} 
                            onCheckedChange={() => handleSubtaskToggle(task.id, subtask.id)}
                            className="mr-2 h-3 w-3"
                          />
                          <span className={cn(subtask.completed && "line-through text-muted-foreground")}>
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-border p-4 text-center text-muted-foreground">
              {selectedTasks.length > 0 
                ? "No matching tasks found" 
                : "Set your session goals in settings before starting"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionGoals;

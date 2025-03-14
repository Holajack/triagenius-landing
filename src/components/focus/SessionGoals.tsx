
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Target, ClipboardList, CheckCircle2 } from "lucide-react";
import { SelectedTaskData } from "./TaskSelectionDialog";

const SessionGoals = () => {
  const [selectedTasks, setSelectedTasks] = useState<SelectedTaskData | null>(null);

  useEffect(() => {
    try {
      const savedSelection = localStorage.getItem('selectedTasksForFocus');
      if (savedSelection) {
        const parsedData: SelectedTaskData = JSON.parse(savedSelection);
        setSelectedTasks(parsedData);
      }
    } catch (error) {
      console.error("Error loading saved task selections:", error);
    }
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4" />
          Session Goals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedTasks || selectedTasks.tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Focus on your primary task. Your progress is being tracked and will sync when you're back online.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Selected Focus Areas:</p>
            </div>
            
            <div className="space-y-3">
              {selectedTasks.tasks.map((task) => (
                <div key={task.taskId} className="border rounded-md p-2">
                  <p className="text-sm font-medium">{task.title}</p>
                  
                  {task.subtasks.length > 0 && (
                    <div className="mt-2 pl-3 space-y-1 border-l-2 border-gray-200">
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.subtaskId} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <p className="text-xs">{subtask.title}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionGoals;

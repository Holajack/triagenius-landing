
import { useState, useEffect } from "react";
import { useTasks } from "@/contexts/TaskContext";
import { PriorityLevel } from "@/types/tasks";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Input
} from "@/components/ui/input";
import {
  Button
} from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Flag, 
  ListChecks, 
  ListPlus, 
  PlusCircle, 
  Trash2, 
  X, 
  AlertCircle, 
  CheckCircle,
  ArchiveX,
  Archive
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form schema for adding tasks
const taskFormSchema = z.object({
  title: z.string().min(2, {
    message: "Task name must be at least 2 characters.",
  }),
  priority: z.enum(["low", "medium", "high"] as const),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const priorityColors = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

interface TaskListProps {
  persistToSupabase?: boolean;
}

const TaskList = ({ persistToSupabase = false }: TaskListProps) => {
  const { state, dispatch } = useTasks();
  const { state: onboardingState } = useOnboarding();
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [activeTab, setActiveTab] = useState<string>("active");
  const { user } = useUser();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      priority: "medium",
    },
  });
  
  // Function to check if user can add more tasks based on work style
  const canAddMoreTasks = (): boolean => {
    if (!onboardingState.workStyle) return true;
    
    // For deep-work style, limit to 2 tasks
    if (onboardingState.workStyle === 'deep-work' && state.tasks.length >= 2) {
      return false;
    }
    
    // For other work styles, allow multiple tasks
    return true;
  };
  
  // Save tasks to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('userTasks', JSON.stringify(state.tasks));
    localStorage.setItem('userCompletedTasks', JSON.stringify(state.completedTasks));
    
    // If user is logged in and we should persist to Supabase, sync tasks
    if (persistToSupabase && user && user.id) {
      const syncTasksToSupabase = async () => {
        try {
          // For each task, upsert to Supabase
          // We'll do this in a non-blocking way to prevent freezing
          setTimeout(async () => {
            // First, get existing tasks
            const { data: existingTasks, error: fetchError } = await supabase
              .from('tasks')
              .select('id')
              .eq('user_id', user.id);
              
            if (fetchError) {
              console.error('Error fetching tasks:', fetchError);
              return;
            }
            
            // Create a map of existing task IDs
            const existingTaskIds = new Set((existingTasks || []).map(task => task.id));
            
            // For each task in state, upsert to Supabase
            const allTasks = [...state.tasks, ...state.completedTasks];
            for (const task of allTasks) {
              // Skip if this task already exists
              if (existingTaskIds.has(task.id)) continue;
              
              await supabase
                .from('tasks')
                .upsert({
                  id: task.id,
                  user_id: user.id,
                  title: task.title,
                  status: task.completed ? 'completed' : 'pending',
                  priority: task.priority,
                  description: JSON.stringify(task.subtasks)
                });
            }
          }, 0);
        } catch (error) {
          console.error('Error syncing tasks to Supabase:', error);
        }
      };
      
      syncTasksToSupabase();
    }
  }, [state.tasks, state.completedTasks, persistToSupabase, user]);
  
  // Load tasks from local storage on component mount
  useEffect(() => {
    // Tasks are already loaded from localStorage in the TaskContext
    console.log("Task List mounted with tasks:", state.tasks.length, "and completed tasks:", state.completedTasks.length);
  }, [state.tasks.length, state.completedTasks.length]);

  const onSubmit = (data: TaskFormValues) => {
    // Check if user can add more tasks based on work style
    if (!canAddMoreTasks()) {
      toast.error(
        "Task limit reached", 
        { description: "Deep work mode limits you to 2 main tasks for better focus." }
      );
      return;
    }
    
    dispatch({
      type: "ADD_TASK",
      payload: {
        title: data.title,
        priority: data.priority,
      },
    });
    form.reset();
    toast.success("Task added successfully!");
  };

  const handleToggleExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const handleAddSubtask = (taskId: string) => {
    if (newSubtask.trim()) {
      dispatch({
        type: "ADD_SUBTASK",
        payload: { taskId, title: newSubtask },
      });
      setNewSubtask("");
      toast.success("Subtask added!");
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    dispatch({
      type: "TOGGLE_SUBTASK",
      payload: { taskId, subtaskId },
    });
  };

  const handleRemoveTask = (taskId: string) => {
    dispatch({
      type: "REMOVE_TASK",
      payload: { taskId },
    });
    toast.info("Task removed");
  };

  const handleRemoveSubtask = (taskId: string, subtaskId: string) => {
    dispatch({
      type: "REMOVE_SUBTASK",
      payload: { taskId, subtaskId },
    });
  };
  
  const handleClearCompletedTasks = () => {
    if (state.completedTasks.length === 0) {
      toast.info("No completed tasks to clear");
      return;
    }
    
    dispatch({
      type: "CLEAR_COMPLETED_TASKS",
    });
    toast.success("Completed tasks cleared");
  };
  
  const handleToggleTaskCompletion = (taskId: string, currentState: boolean) => {
    dispatch({
      type: "UPDATE_TASK",
      payload: { 
        taskId, 
        completed: !currentState 
      },
    });
    
    toast.success(currentState ? "Task marked as active" : "Task marked as completed");
  };

  const getPriorityIcon = (priority: PriorityLevel) => {
    const className = "h-4 w-4 mr-1";
    switch (priority) {
      case "high":
        return <Flag className={`${className} text-red-600`} />;
      case "medium":
        return <Flag className={`${className} text-yellow-600`} />;
      case "low":
        return <Flag className={`${className} text-green-600`} />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <ListChecks className="h-5 w-5 mr-2" />
            Create Your Subject/Task List
          </div>
          {onboardingState.workStyle === 'deep-work' && (
            <div className="text-xs text-amber-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Max 2 tasks (Deep Work Mode)
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col md:flex-row gap-2 mb-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="Add a new subject or task..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem className="w-full md:w-40">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full md:w-auto"
              disabled={!canAddMoreTasks()}
            >
              <PlusCircle className="h-4 w-4 mr-1" /> Add
            </Button>
          </form>
        </Form>

        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="active" className="flex items-center">
              <ListChecks className="h-4 w-4 mr-1" /> 
              Active Tasks ({state.tasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" /> 
              Completed ({state.completedTasks.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <div className="space-y-2">
              {state.tasks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No active tasks. Add your first task above!
                </div>
              ) : (
                state.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="border rounded-md p-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTaskCompletion(task.id, task.completed)}
                        />
                        <span
                          className={`${
                            task.completed ? "line-through text-gray-400" : ""
                          } font-medium truncate`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {getPriorityIcon(task.priority)}
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleExpand(task.id)}
                        >
                          <ListPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {expandedTaskId === task.id && (
                      <div className="mt-3 pl-6">
                        <div className="flex items-center space-x-2 mb-2">
                          <Input
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            placeholder="Add subtask or topic..."
                            className="flex-1"
                            size={30}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddSubtask(task.id)}
                          >
                            Add
                          </Button>
                        </div>

                        <div className="space-y-1 mt-1">
                          {task.subtasks.map((subtask) => (
                            <div
                              key={subtask.id}
                              className="flex items-center justify-between group"
                            >
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={subtask.completed}
                                  onCheckedChange={() =>
                                    handleToggleSubtask(task.id, subtask.id)
                                  }
                                />
                                <span
                                  className={
                                    subtask.completed
                                      ? "line-through text-gray-400"
                                      : ""
                                  }
                                >
                                  {subtask.title}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() =>
                                  handleRemoveSubtask(task.id, subtask.id)
                                }
                              >
                                <X className="h-3 w-3 text-gray-400" />
                              </Button>
                            </div>
                          ))}

                          {task.subtasks.length === 0 && (
                            <div className="text-xs text-muted-foreground pl-6">
                              No subtasks or topics yet
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="completed">
            <div className="space-y-2">
              {state.completedTasks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No completed tasks yet.
                </div>
              ) : (
                state.completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border rounded-md p-3 overflow-hidden bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <Checkbox
                          checked={true}
                          onCheckedChange={() => handleToggleTaskCompletion(task.id, task.completed)}
                        />
                        <span className="line-through text-gray-400 font-medium truncate">
                          {task.title}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap opacity-70 ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {getPriorityIcon(task.priority)}
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleTaskCompletion(task.id, task.completed)}
                          className="text-green-600"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {task.subtasks.length > 0 && (
                      <div className="mt-2 pl-6 space-y-1">
                        {task.subtasks.map((subtask) => (
                          <div
                            key={subtask.id}
                            className="flex items-center text-sm text-gray-500"
                          >
                            <span className="w-4 text-xs text-gray-400">•</span>
                            <span className={subtask.completed ? "line-through" : ""}>
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {state.completedTasks.length > 0 && (
        <CardFooter className="flex justify-end px-6 py-4 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearCompletedTasks}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <ArchiveX className="h-4 w-4 mr-1" />
            Clear Completed Tasks
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default TaskList;

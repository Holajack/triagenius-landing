
import { useState } from "react";
import { useTasks } from "@/contexts/TaskContext";
import { PriorityLevel } from "@/types/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Flag, ListChecks, ListPlus, PlusCircle, Trash2, X } from "lucide-react";

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

const TaskList = () => {
  const { state, dispatch } = useTasks();
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState("");

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      priority: "medium",
    },
  });

  const onSubmit = (data: TaskFormValues) => {
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
        <CardTitle className="flex items-center">
          <ListChecks className="h-5 w-5 mr-2" />
          Create Your Subject/Task List
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
            <Button type="submit" className="w-full md:w-auto">
              <PlusCircle className="h-4 w-4 mr-1" /> Add
            </Button>
          </form>
        </Form>

        <div className="space-y-2">
          {state.tasks.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No tasks yet. Add your first task above!
            </div>
          ) : (
            state.tasks.map((task) => (
              <div
                key={task.id}
                className="border rounded-md p-3 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() =>
                        dispatch({
                          type: "UPDATE_TASK",
                          payload: {
                            taskId: task.id,
                            completed: !task.completed,
                          },
                        })
                      }
                    />
                    <span
                      className={`${
                        task.completed ? "line-through text-gray-400" : ""
                      } font-medium`}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        priorityColors[task.priority]
                      }`}
                    >
                      {getPriorityIcon(task.priority)}
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
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
      </CardContent>
    </Card>
  );
};

export default TaskList;

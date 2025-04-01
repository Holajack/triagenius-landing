
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Task, SubTask, PriorityLevel } from '@/types/tasks';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/use-user';

interface TaskState {
  tasks: Task[];
  completedTasks: Task[]; // Added to store completed tasks separately
}

type TaskAction = 
  | { type: 'ADD_TASK'; payload: { title: string; priority: PriorityLevel } }
  | { type: 'REMOVE_TASK'; payload: { taskId: string } }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; title?: string; priority?: PriorityLevel; completed?: boolean } }
  | { type: 'ADD_SUBTASK'; payload: { taskId: string; title: string } }
  | { type: 'REMOVE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'TOGGLE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'CLEAR_COMPLETED_TASKS' }
  | { type: 'LOAD_TASKS'; payload: { tasks: Task[]; completedTasks?: Task[] } };

// Try to load initial state from localStorage
const loadInitialState = (): TaskState => {
  try {
    const savedTasks = localStorage.getItem('userTasks');
    const savedCompletedTasks = localStorage.getItem('userCompletedTasks');
    
    let tasks: Task[] = [];
    let completedTasks: Task[] = [];
    
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      if (Array.isArray(parsedTasks)) {
        tasks = parsedTasks;
      }
    }
    
    if (savedCompletedTasks) {
      const parsedCompletedTasks = JSON.parse(savedCompletedTasks);
      if (Array.isArray(parsedCompletedTasks)) {
        completedTasks = parsedCompletedTasks;
      }
    }
    
    return { tasks, completedTasks };
  } catch (e) {
    console.error('Failed to load tasks from localStorage', e);
  }
  
  return { tasks: [], completedTasks: [] };
};

const initialState: TaskState = loadInitialState();

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  let newState: TaskState;
  
  switch (action.type) {
    case 'LOAD_TASKS':
      newState = {
        ...state,
        tasks: action.payload.tasks,
        completedTasks: action.payload.completedTasks || state.completedTasks
      };
      break;
      
    case 'ADD_TASK':
      newState = {
        ...state,
        tasks: [
          ...state.tasks,
          {
            id: generateId(),
            title: action.payload.title,
            priority: action.payload.priority,
            subtasks: [],
            completed: false
          }
        ]
      };
      break;
      
    case 'REMOVE_TASK':
      newState = {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload.taskId),
        completedTasks: state.completedTasks.filter(task => task.id !== action.payload.taskId)
      };
      break;
      
    case 'UPDATE_TASK':
      // If task is being marked as completed, move it to completedTasks array
      if (action.payload.completed === true) {
        const taskToComplete = state.tasks.find(task => task.id === action.payload.taskId);
        
        if (taskToComplete) {
          const updatedTask = { 
            ...taskToComplete, 
            ...(action.payload.title !== undefined && { title: action.payload.title }),
            ...(action.payload.priority !== undefined && { priority: action.payload.priority }),
            completed: true
          };
          
          newState = {
            tasks: state.tasks.filter(task => task.id !== action.payload.taskId),
            completedTasks: [...state.completedTasks, updatedTask]
          };
        } else {
          // If task not found in active tasks, update it in completed tasks if it exists there
          newState = {
            ...state,
            completedTasks: state.completedTasks.map(task => 
              task.id === action.payload.taskId
                ? { 
                    ...task, 
                    ...(action.payload.title !== undefined && { title: action.payload.title }),
                    ...(action.payload.priority !== undefined && { priority: action.payload.priority }),
                    completed: true
                  }
                : task
            )
          };
        }
      } else if (action.payload.completed === false) {
        // If task is being marked as not completed, move it back to tasks array
        const taskToUncomplete = state.completedTasks.find(task => task.id === action.payload.taskId);
        
        if (taskToUncomplete) {
          const updatedTask = { 
            ...taskToUncomplete, 
            ...(action.payload.title !== undefined && { title: action.payload.title }),
            ...(action.payload.priority !== undefined && { priority: action.payload.priority }),
            completed: false
          };
          
          newState = {
            completedTasks: state.completedTasks.filter(task => task.id !== action.payload.taskId),
            tasks: [...state.tasks, updatedTask]
          };
        } else {
          // Just update the task in the tasks array
          newState = {
            ...state,
            tasks: state.tasks.map(task => 
              task.id === action.payload.taskId
                ? { 
                    ...task, 
                    ...(action.payload.title !== undefined && { title: action.payload.title }),
                    ...(action.payload.priority !== undefined && { priority: action.payload.priority }),
                    completed: false
                  }
                : task
            )
          };
        }
      } else {
        // No completion status change, just update other properties
        newState = {
          ...state,
          tasks: state.tasks.map(task => 
            task.id === action.payload.taskId
              ? { 
                  ...task, 
                  ...(action.payload.title !== undefined && { title: action.payload.title }),
                  ...(action.payload.priority !== undefined && { priority: action.payload.priority })
                }
              : task
          ),
          completedTasks: state.completedTasks.map(task => 
            task.id === action.payload.taskId
              ? { 
                  ...task, 
                  ...(action.payload.title !== undefined && { title: action.payload.title }),
                  ...(action.payload.priority !== undefined && { priority: action.payload.priority })
                }
              : task
          )
        };
      }
      break;
      
    case 'ADD_SUBTASK':
      newState = {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.taskId
            ? { 
                ...task, 
                subtasks: [
                  ...task.subtasks,
                  {
                    id: generateId(),
                    title: action.payload.title,
                    completed: false
                  }
                ]
              }
            : task
        ),
        completedTasks: state.completedTasks.map(task => 
          task.id === action.payload.taskId
            ? { 
                ...task, 
                subtasks: [
                  ...task.subtasks,
                  {
                    id: generateId(),
                    title: action.payload.title,
                    completed: false
                  }
                ]
              }
            : task
        )
      };
      break;
      
    case 'REMOVE_SUBTASK':
      newState = {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.taskId
            ? { 
                ...task, 
                subtasks: task.subtasks.filter(
                  subtask => subtask.id !== action.payload.subtaskId
                )
              }
            : task
        ),
        completedTasks: state.completedTasks.map(task => 
          task.id === action.payload.taskId
            ? { 
                ...task, 
                subtasks: task.subtasks.filter(
                  subtask => subtask.id !== action.payload.subtaskId
                )
              }
            : task
        )
      };
      break;
      
    case 'TOGGLE_SUBTASK':
      newState = {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.taskId
            ? { 
                ...task, 
                subtasks: task.subtasks.map(subtask => 
                  subtask.id === action.payload.subtaskId
                    ? { ...subtask, completed: !subtask.completed }
                    : subtask
                )
              }
            : task
        ),
        completedTasks: state.completedTasks.map(task => 
          task.id === action.payload.taskId
            ? { 
                ...task, 
                subtasks: task.subtasks.map(subtask => 
                  subtask.id === action.payload.subtaskId
                    ? { ...subtask, completed: !subtask.completed }
                    : subtask
                )
              }
            : task
        )
      };
      break;
      
    case 'CLEAR_COMPLETED_TASKS':
      newState = {
        ...state,
        completedTasks: []
      };
      break;
      
    default:
      return state;
  }
  
  // Save to localStorage after each action
  try {
    localStorage.setItem('userTasks', JSON.stringify(newState.tasks));
    localStorage.setItem('userCompletedTasks', JSON.stringify(newState.completedTasks));
  } catch (e) {
    console.error('Failed to save tasks to localStorage', e);
  }
  
  return newState;
};

type TaskContextType = {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
  syncTasksWithSupabase: () => Promise<void>;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { user } = useUser();
  
  // Sync with Supabase when user changes
  useEffect(() => {
    if (user && user.id) {
      loadTasksFromSupabase();
    }
  }, [user?.id]);
  
  // Load tasks from Supabase
  const loadTasksFromSupabase = async () => {
    if (!user || !user.id) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Convert Supabase tasks to our local task format
        const activeTasks: Task[] = [];
        const completedTasks: Task[] = [];
        
        data.forEach(dbTask => {
          const task: Task = {
            id: dbTask.id,
            title: dbTask.title,
            priority: (dbTask.priority as PriorityLevel) || 'medium',
            completed: dbTask.status === 'completed',
            subtasks: [] // We'll load subtasks separately in the future if needed
          };
          
          if (task.completed) {
            completedTasks.push(task);
          } else {
            activeTasks.push(task);
          }
        });
        
        dispatch({ type: 'LOAD_TASKS', payload: { tasks: activeTasks, completedTasks } });
      } else {
        // If no tasks in Supabase, use localStorage tasks
        console.log("No tasks found in Supabase, using localStorage tasks");
      }
    } catch (error) {
      console.error('Error loading tasks from Supabase:', error);
    }
  };
  
  // Sync local tasks to Supabase
  const syncTasksWithSupabase = async () => {
    if (!user || !user.id) return;
    
    try {
      // For simplicity, we'll just delete all existing tasks and re-add them
      // In a real app, you'd want to do a proper sync with updates/deletes/inserts
      
      // Delete all existing tasks for this user
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id);
        
      if (deleteError) {
        throw deleteError;
      }
      
      // Skip if no tasks to sync
      const allTasks = [...state.tasks, ...state.completedTasks];
      if (allTasks.length === 0) return;
      
      // Insert all current tasks
      const tasksToInsert = allTasks.map(task => ({
        title: task.title,
        user_id: user.id,
        priority: task.priority,
        status: task.completed ? 'completed' : 'pending',
        description: JSON.stringify(task.subtasks)
      }));
      
      const { error: insertError } = await supabase
        .from('tasks')
        .insert(tasksToInsert);
        
      if (insertError) {
        throw insertError;
      }
      
      console.log('Tasks synced to Supabase successfully');
    } catch (error) {
      console.error('Error syncing tasks to Supabase:', error);
    }
  };
  
  // Sync with localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem('userTasks', JSON.stringify(state.tasks));
      localStorage.setItem('userCompletedTasks', JSON.stringify(state.completedTasks));
      
      // Optionally sync with Supabase if user is logged in
      if (user?.id) {
        const debouncedSync = setTimeout(() => {
          syncTasksWithSupabase();
        }, 2000); // Debounce to avoid too many calls
        
        return () => clearTimeout(debouncedSync);
      }
    } catch (e) {
      console.error('Failed to sync tasks to localStorage', e);
    }
  }, [state.tasks, state.completedTasks, user?.id]);

  return (
    <TaskContext.Provider value={{ 
      state, 
      dispatch,
      syncTasksWithSupabase
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

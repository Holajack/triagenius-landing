
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Task, SubTask, PriorityLevel } from '@/types/tasks';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/use-user';

interface TaskState {
  tasks: Task[];
}

type TaskAction = 
  | { type: 'ADD_TASK'; payload: { title: string; priority: PriorityLevel } }
  | { type: 'REMOVE_TASK'; payload: { taskId: string } }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; title?: string; priority?: PriorityLevel; completed?: boolean } }
  | { type: 'ADD_SUBTASK'; payload: { taskId: string; title: string } }
  | { type: 'REMOVE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'TOGGLE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'CLEAR_COMPLETED_TASKS' }
  | { type: 'LOAD_TASKS'; payload: { tasks: Task[] } };

// Try to load initial state from localStorage
const loadInitialState = (): TaskState => {
  try {
    const savedTasks = localStorage.getItem('userTasks');
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      if (Array.isArray(parsedTasks)) {
        return { tasks: parsedTasks };
      }
    }
  } catch (e) {
    console.error('Failed to load tasks from localStorage', e);
  }
  
  return { tasks: [] };
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
        tasks: action.payload.tasks
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
        tasks: state.tasks.filter(task => task.id !== action.payload.taskId)
      };
      break;
      
    case 'UPDATE_TASK':
      newState = {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.taskId
            ? { 
                ...task, 
                ...(action.payload.title !== undefined && { title: action.payload.title }),
                ...(action.payload.priority !== undefined && { priority: action.payload.priority }),
                ...(action.payload.completed !== undefined && { completed: action.payload.completed })
              }
            : task
        )
      };
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
        )
      };
      break;
      
    case 'CLEAR_COMPLETED_TASKS':
      newState = {
        ...state,
        tasks: state.tasks.filter(task => !task.completed)
      };
      break;
      
    default:
      return state;
  }
  
  // Save to localStorage after each action
  try {
    localStorage.setItem('userTasks', JSON.stringify(newState.tasks));
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
        const tasks: Task[] = data.map(dbTask => ({
          id: dbTask.id,
          title: dbTask.title,
          priority: (dbTask.priority as PriorityLevel) || 'medium',
          completed: dbTask.status === 'completed',
          subtasks: [] // We'll load subtasks separately in the future if needed
        }));
        
        dispatch({ type: 'LOAD_TASKS', payload: { tasks } });
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
      if (state.tasks.length === 0) return;
      
      // Insert all current tasks
      const tasksToInsert = state.tasks.map(task => ({
        title: task.title,
        user_id: user.id,
        priority: task.priority,
        status: task.completed ? 'completed' : 'pending',
        description: '' // No description in our local model
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
  }, [state.tasks, user?.id]);

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

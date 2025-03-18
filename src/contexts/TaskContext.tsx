
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Task, SubTask, PriorityLevel } from '@/types/tasks';

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
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  
  // Sync with localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem('userTasks', JSON.stringify(state.tasks));
    } catch (e) {
      console.error('Failed to sync tasks to localStorage', e);
    }
  }, [state.tasks]);

  return (
    <TaskContext.Provider value={{ state, dispatch }}>
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

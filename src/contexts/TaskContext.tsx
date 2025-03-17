
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
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
  | { type: 'CLEAR_COMPLETED_TASKS' };

const initialState: TaskState = {
  tasks: []
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'ADD_TASK':
      return {
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
      
    case 'REMOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload.taskId)
      };
      
    case 'UPDATE_TASK':
      return {
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
      
    case 'ADD_SUBTASK':
      return {
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
      
    case 'REMOVE_SUBTASK':
      return {
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
      
    case 'TOGGLE_SUBTASK':
      return {
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
      
    case 'CLEAR_COMPLETED_TASKS':
      return {
        ...state,
        tasks: state.tasks.filter(task => !task.completed)
      };
      
    default:
      return state;
  }
};

type TaskContextType = {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

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


export type PriorityLevel = 'low' | 'medium' | 'high';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  priority: PriorityLevel;
  subtasks: SubTask[];
  completed: boolean;
}

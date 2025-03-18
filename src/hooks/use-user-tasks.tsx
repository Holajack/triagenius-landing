
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserTask } from '@/types/database';
import { useUser } from './use-user';

export function useUserTasks() {
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();
  
  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_tasks')
        .select('*')
        .order('due_date', { ascending: true, nullsLast: true });
        
      if (error) throw error;
      
      setTasks(data || []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };
  
  const addTask = async (newTask: Omit<UserTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast.error('You must be logged in to add a task');
      return null;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_tasks')
        .insert({ 
          ...newTask,
          user_id: user.id 
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setTasks(prev => [data as UserTask, ...prev]);
      toast.success('Task added successfully');
      return data as UserTask;
    } catch (err: any) {
      console.error('Error adding task:', err);
      toast.error(err.message || 'Failed to add task');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const updateTask = async (id: string, updates: Partial<UserTask>) => {
    if (!user) {
      toast.error('You must be logged in to update a task');
      return false;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setTasks(prev => 
        prev.map(task => 
          task.id === id ? { ...task, ...updates } : task
        )
      );
      
      toast.success('Task updated successfully');
      return true;
    } catch (err: any) {
      console.error('Error updating task:', err);
      toast.error(err.message || 'Failed to update task');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteTask = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete a task');
      return false;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setTasks(prev => prev.filter(task => task.id !== id));
      toast.success('Task deleted successfully');
      return true;
    } catch (err: any) {
      console.error('Error deleting task:', err);
      toast.error(err.message || 'Failed to delete task');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);
  
  return {
    tasks,
    loading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask
  };
}

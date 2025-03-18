
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Subject } from '@/types/database';
import { useUser } from './use-user';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();
  
  const fetchSubjects = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setSubjects(data || []);
    } catch (err: any) {
      console.error('Error fetching subjects:', err);
      setError(err);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };
  
  const addSubject = async (newSubject: Omit<Subject, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast.error('You must be logged in to add a subject');
      return null;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('subjects')
        .insert({ 
          ...newSubject,
          user_id: user.id 
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setSubjects(prev => [data as Subject, ...prev]);
      toast.success('Subject added successfully');
      return data as Subject;
    } catch (err: any) {
      console.error('Error adding subject:', err);
      toast.error(err.message || 'Failed to add subject');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    if (!user) {
      toast.error('You must be logged in to update a subject');
      return false;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setSubjects(prev => 
        prev.map(subject => 
          subject.id === id ? { ...subject, ...updates } : subject
        )
      );
      
      toast.success('Subject updated successfully');
      return true;
    } catch (err: any) {
      console.error('Error updating subject:', err);
      toast.error(err.message || 'Failed to update subject');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteSubject = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete a subject');
      return false;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setSubjects(prev => prev.filter(subject => subject.id !== id));
      toast.success('Subject deleted successfully');
      return true;
    } catch (err: any) {
      console.error('Error deleting subject:', err);
      toast.error(err.message || 'Failed to delete subject');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchSubjects();
    }
  }, [user]);
  
  return {
    subjects,
    loading,
    error,
    fetchSubjects,
    addSubject,
    updateSubject,
    deleteSubject
  };
}


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAuthState() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setSession(data.session);
      } catch (err) {
        console.error('Error getting auth session:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    // Clean up listener on unmount
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Function to handle sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast.success('Successfully signed out');
    } catch (err) {
      console.error('Error signing out:', err);
      toast.error('Failed to sign out');
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    loading,
    error,
    signOut,
    isAuthenticated: !!session,
  };
}

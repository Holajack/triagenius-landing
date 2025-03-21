
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { saveUserSession, loadUserSession, applySessionPreferences } from '@/services/sessionPersistence';

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
        
        // If a session exists, load saved user preferences
        if (data.session?.user?.id) {
          try {
            const savedSession = await loadUserSession(data.session.user.id);
            applySessionPreferences(savedSession);
            console.log("Applied user preferences from previous session");
          } catch (err) {
            console.error("Failed to load previous session data:", err);
          }
        }
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

  // Enhanced sign out function to save session data
  const signOut = async () => {
    try {
      setLoading(true);
      
      // Save session data before signing out
      if (session?.user?.id) {
        await saveUserSession(session.user.id);
        toast.success('Session data saved');
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast.success('Successfully signed out');
      
      // Note: We don't use navigate here anymore since this hook shouldn't depend on React Router
      // The component using this hook should handle navigation after signOut
      // This makes the hook more reusable
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

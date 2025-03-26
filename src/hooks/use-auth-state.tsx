
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { saveUserSession, loadUserSession, applySessionPreferences } from '@/services/sessionPersistence';

// Enable this for debugging environment issues
const DEBUG_AUTH = true;

export function useAuthState() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[useAuthState] Session error:', error);
          throw error;
        }
        
        if (DEBUG_AUTH) console.log('[useAuthState] Initial session:', data.session?.user?.id ? 'User logged in' : 'No session');
        setSession(data.session);
        
        // If a session exists, load saved user preferences
        if (data.session?.user?.id) {
          try {
            const savedSession = await loadUserSession(data.session.user.id);
            applySessionPreferences(savedSession);
            console.log("[useAuthState] Applied user preferences from previous session");
          } catch (err) {
            console.error("[useAuthState] Failed to load previous session data:", err);
          }
        }
      } catch (err) {
        console.error('[useAuthState] Error getting auth session:', err);
        setError(err);
      } finally {
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    getInitialSession();

    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (DEBUG_AUTH) console.log('[useAuthState] Auth state change event:', event, currentSession?.user?.id);
        
        // Update session state
        setSession(currentSession);
        
        // Reset error state on successful sign-in
        if (event === 'SIGNED_IN' && currentSession) {
          setError(null);
        }
        
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
    authInitialized,
  };
}

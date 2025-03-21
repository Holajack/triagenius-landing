
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile } from "@/types/database";
import { saveUserSession, loadUserSession, applySessionPreferences } from "@/services/sessionPersistence";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

interface UserData {
  id: string;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
  isLoading: boolean;
  profile: UserProfile | null;
}

interface UserContextType {
  user: UserData | null;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();
  const { setTheme, setEnvironmentTheme } = useTheme();
  
  const clearError = () => setError(null);
  
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw authError;
      }
      
      if (!authUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Set initial user data
      setUser({
        id: authUser.id,
        email: authUser.email,
        username: null,
        avatarUrl: null,
        isLoading: true,
        profile: null
      });
      
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (profileError) {
        // Check if profile doesn't exist yet
        if (profileError.code === 'PGRST116') {
          // Create profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              username: authUser.email?.split('@')[0] || null,
              preferences: {},
              privacy_settings: {
                showEmail: false,
                showActivity: true
              }
            });
            
          if (insertError) {
            console.error("Error creating profile:", insertError);
          }
          
          // Update with default data
          setUser({
            id: authUser.id,
            email: authUser.email,
            username: authUser.email?.split('@')[0] || null,
            avatarUrl: null,
            isLoading: false,
            profile: null
          });
        } else {
          console.error("Error fetching profile:", profileError);
          setUser(prev => prev ? { ...prev, isLoading: false } : null);
        }
        setIsLoading(false);
        return;
      }
      
      // Update with profile data
      setUser({
        id: authUser.id,
        email: profileData.email || authUser.email,
        username: profileData.username || authUser.email?.split('@')[0] || null,
        avatarUrl: profileData.avatar_url,
        isLoading: false,
        profile: profileData as UserProfile
      });
      
      // Load and apply saved session after successful login
      const savedSession = await loadUserSession(authUser.id);
      if (savedSession) {
        applySessionPreferences(savedSession, setTheme, setEnvironmentTheme);
        
        // Check if we should redirect to last route
        if (savedSession.lastRoute && savedSession.lastRoute !== window.location.pathname) {
          // Only redirect to certain safe routes, not to auth pages for example
          const safeRoutes = ['/dashboard', '/focus-session', '/bonuses', '/reports', '/profile', '/settings'];
          if (safeRoutes.some(route => savedSession.lastRoute.startsWith(route))) {
            // If there's a saved focus session and the last route was the focus session page
            if (savedSession.focusSession && savedSession.lastRoute === '/focus-session') {
              toast.info("You have a saved focus session. Continue where you left off?", {
                action: {
                  label: "Resume",
                  onClick: () => navigate('/focus-session')
                },
                duration: 10000
              });
            } else if (savedSession.lastRoute !== '/dashboard') {
              // For other routes, show a toast with option to navigate back
              toast.info(`You were last on ${savedSession.lastRoute}`, {
                action: {
                  label: "Go back",
                  onClick: () => navigate(savedSession.lastRoute)
                },
                duration: 5000
              });
            }
          }
        }
      }
      
    } catch (error: any) {
      console.error("Failed to fetch user data:", error);
      setError(error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast.success("Profile updated successfully");
      await fetchUserData(); // Refresh user data
      
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced logout function to save session before logging out
  const logout = async () => {
    try {
      if (user?.id) {
        // Save the current session state before logout
        await saveUserSession(user.id);
      }
      
      // Proceed with logout
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Successfully signed out");
      navigate('/');
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error(error.message || "Failed to sign out");
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchUserData();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return (
    <UserContext.Provider value={{ 
      user, 
      refreshUser: fetchUserData, 
      isLoading,
      error,
      clearError,
      updateProfile,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

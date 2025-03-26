import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile } from "@/types/database";
import { saveUserSession, loadUserSession, applySessionPreferences } from "@/services/sessionPersistence";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

const DEBUG_ENV = true;

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
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const { setTheme, setEnvironmentTheme } = useTheme();
  
  const clearError = () => setError(null);
  
  const createUserProfile = async (authUser: any) => {
    console.log('[useUser] Creating new profile for user:', authUser.id);
    
    try {
      // Get environment from localStorage if available, otherwise default to 'office'
      const savedEnvironment = localStorage.getItem('environment') || 'office';
      if (DEBUG_ENV) console.log('[useUser] Using environment for new profile:', savedEnvironment);
      
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
          },
          last_selected_environment: savedEnvironment
        });
        
      if (insertError) {
        console.error("[useUser] Error creating profile:", insertError);
        throw insertError;
      }
      
      console.log('[useUser] Profile created successfully');
      
      // Also create onboarding preferences
      const { error: onboardingError } = await supabase
        .from('onboarding_preferences')
        .insert({
          user_id: authUser.id,
          learning_environment: savedEnvironment
        });
        
      if (onboardingError && onboardingError.code !== '23505') { // Ignore duplicate key errors
        console.error("[useUser] Error creating onboarding preferences:", onboardingError);
      }
      
      // Also create leaderboard stats
      const { error: leaderboardError } = await supabase
        .from('leaderboard_stats')
        .insert({
          user_id: authUser.id
        });
        
      if (leaderboardError && leaderboardError.code !== '23505') { // Ignore duplicate key errors
        console.error("[useUser] Error creating leaderboard stats:", leaderboardError);
      }
      
      return true;
    } catch (err) {
      console.error("[useUser] Error in createUserProfile:", err);
      return false;
    }
  };
  
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      // First, check if we're actually authenticated
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("[useUser] Auth error:", authError);
        throw authError;
      }
      
      if (!authUser) {
        console.log("[useUser] No authenticated user found");
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      console.log("[useUser] Auth user found:", authUser.id);
      
      // Initial user state with loading indicator
      setUser({
        id: authUser.id,
        email: authUser.email,
        username: null,
        avatarUrl: null,
        isLoading: true,
        profile: null
      });
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, last_selected_environment')
        .eq('id', authUser.id)
        .maybeSingle();
      
      // Fix: this variable needs to be declared with 'let' so it can be reassigned
      let userProfileData = profileData;
      
      // If profile doesn't exist, create it
      if (profileError || !userProfileData) {
        console.log("[useUser] Profile not found or error:", profileError);
        
        // Create a new profile
        const profileCreated = await createUserProfile(authUser);
        
        if (!profileCreated) {
          throw new Error("Failed to create user profile");
        }
        
        // Retry fetching the profile after creation
        const { data: newProfileData, error: newProfileError } = await supabase
          .from('profiles')
          .select('*, last_selected_environment')
          .eq('id', authUser.id)
          .maybeSingle();
          
        if (newProfileError || !newProfileData) {
          console.error("[useUser] Still could not fetch profile after creation:", newProfileError);
          throw new Error("Failed to retrieve user profile after creation");
        }
        
        userProfileData = newProfileData;
      }
      
      // Fetch onboarding preferences
      const { data: prefsData, error: prefsError } = await supabase
        .from('onboarding_preferences')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();
        
      if (prefsError && prefsError.code !== 'PGRST116') {
        console.error("[useUser] Error fetching preferences:", prefsError);
      }
      
      // Update user state with profile data
      setUser({
        id: authUser.id,
        email: userProfileData.email || authUser.email,
        username: userProfileData.username || authUser.email?.split('@')[0] || null,
        avatarUrl: userProfileData.avatar_url,
        isLoading: false,
        profile: userProfileData as UserProfile
      });
      
      // Get environment from database - THIS IS OUR SOURCE OF TRUTH
      let environmentToApply = userProfileData.last_selected_environment;
      
      if (DEBUG_ENV) console.log('[useUser] Profile environment from DB:', environmentToApply);
      if (DEBUG_ENV && prefsData) console.log('[useUser] Onboarding preferences environment:', prefsData.learning_environment);
      
      // Sync environments if needed - make sure both DB tables have the same value
      if (prefsData && prefsData.learning_environment !== environmentToApply) {
        if (DEBUG_ENV) console.log('[useUser] Syncing onboarding_preferences to match profile environment:', environmentToApply);
        
        await supabase
          .from('onboarding_preferences')
          .update({
            learning_environment: environmentToApply
          })
          .eq('user_id', authUser.id);
      }
      
      // Apply environment theme
      if (environmentToApply) {
        if (DEBUG_ENV) console.log(`[useUser] Applying environment theme on login: ${environmentToApply}`);
        
        // Set localStorage AFTER we've fetched from DB to ensure DB is source of truth
        localStorage.setItem('environment', environmentToApply);
        
        // Apply theme to document
        document.documentElement.classList.remove(
          'theme-office', 
          'theme-park', 
          'theme-home', 
          'theme-coffee-shop', 
          'theme-library'
        );
        
        document.documentElement.classList.add(`theme-${environmentToApply}`);
        document.documentElement.setAttribute('data-environment', environmentToApply);
        
        // Update theme context with DB value
        setEnvironmentTheme(environmentToApply);
      }
      
      // Apply saved session preferences if available, but don't override the environment
      // that we just set from the database - which is our source of truth
      try {
        const savedSession = await loadUserSession(authUser.id);
        if (savedSession) {
          // Don't override the environment
          const savedEnvironment = environmentToApply;
          
          // Apply other preferences from saved session
          applySessionPreferences(savedSession, setTheme, setEnvironmentTheme, savedEnvironment);
          
          // Show toast for resuming session
          if (savedSession.lastRoute && savedSession.lastRoute !== window.location.pathname) {
            const safeRoutes = ['/dashboard', '/focus-session', '/bonuses', '/reports', '/profile', '/settings'];
            if (safeRoutes.some(route => savedSession.lastRoute.startsWith(route))) {
              if (savedSession.focusSession && savedSession.lastRoute === '/focus-session') {
                toast.info("You have a saved focus session. Continue where you left off?", {
                  action: {
                    label: "Resume",
                    onClick: () => navigate('/focus-session')
                  },
                  duration: 10000
                });
              } else if (savedSession.lastRoute !== '/dashboard') {
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
        
        // Save user preferences to localStorage
        if (prefsData) {
          localStorage.setItem('userPreferences', JSON.stringify({
            userGoal: prefsData.user_goal,
            workStyle: prefsData.work_style,
            environment: environmentToApply, // Use the DB value
            soundPreference: prefsData.sound_preference,
            weeklyFocusGoal: prefsData.weekly_focus_goal || 10,
          }));
        }
      } catch (err) {
        console.error("[useUser] Error loading saved session:", err);
      }
      
      // Reset retry count on success
      setRetryCount(0);
      
    } catch (error: any) {
      console.error("[useUser] Failed to fetch user data:", error);
      setError(error);
      setUser(null);
      
      // Increment retry count if we should retry
      if (retryCount < 3) {
        console.log(`[useUser] Retrying fetchUserData (attempt ${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
        setTimeout(fetchUserData, 1000); // Retry after 1 second
      } else {
        // After 3 retries, show error toast and redirect to auth
        toast.error("Unable to load your profile. Please try logging in again.");
        // Don't redirect if already on auth page
        if (!window.location.pathname.includes('/auth')) {
          navigate('/auth');
        }
      }
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
      await fetchUserData();
      
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user?.id) {
        // Save the current environment before logout so it can be restored on next login
        const currentEnvironment = localStorage.getItem('environment');
        if (currentEnvironment && user.profile) {
          // Update the database with the latest environment
          await supabase
            .from('profiles')
            .update({ 
              last_selected_environment: currentEnvironment 
            })
            .eq('id', user.id);
            
          console.log("[useUser] Saved environment before logout:", currentEnvironment);
        }
        
        // Save session data
        await saveUserSession(user.id);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Successfully signed out");
      navigate('/');
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error(error.message || "Failed to sign out");
    }
  };
  
  useEffect(() => {
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (DEBUG_ENV) console.log('[useUser] Auth state change event:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('[useUser] User signed in, fetching profile data');
        fetchUserData();
      } else if (event === 'SIGNED_OUT') {
        console.log('[useUser] User signed out, clearing state');
        setUser(null);
      }
    });
    
    // Initial fetch
    fetchUserData();
    
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

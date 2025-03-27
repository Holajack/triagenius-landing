
import { ReactNode, useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = () => {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { user, isLoading: userLoading, error: userError, refreshUser } = useUser();
  const [retrying, setRetrying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  
  useEffect(() => {
    // Handle edge case when authenticated but user data fails to load
    if (isAuthenticated && !userLoading && !user && !retrying && attemptCount < 3) {
      console.error("User authenticated but profile not loaded:", userError);
      
      // Try to check if profile actually exists
      const checkAndFixProfile = async () => {
        try {
          setRetrying(true);
          
          // Get current auth user
          const { data: authData, error: authError } = await supabase.auth.getUser();
          
          if (authError || !authData.user) {
            console.error("Session expired or auth error:", authError);
            toast.error("Session expired. Please log in again.");
            navigate("/auth", { replace: true });
            return;
          }
          
          console.log("Auth user found, checking for profile:", authData.user.id);
          
          // Check if profile exists
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', authData.user.id)
            .maybeSingle();
            
          if (profileError) {
            console.error("Error checking profile:", profileError);
          }
          
          // If profile doesn't exist, create one
          if (!profileData) {
            console.log("Profile doesn't exist, creating one...");
            const { error: createError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user.id,
                email: authData.user.email,
                username: authData.user.email?.split('@')[0] || 'user',
                last_selected_environment: 'office'
              });
              
            if (createError) {
              console.error("Failed to create profile:", createError);
              toast.error("Failed to create user profile. Please try logging in again.");
              navigate("/auth", { replace: true });
              return;
            }
            
            // Also create onboarding preferences
            const { error: onboardingError } = await supabase
              .from('onboarding_preferences')
              .insert({
                user_id: authData.user.id,
                learning_environment: 'office'
              });
              
            if (onboardingError && onboardingError.code !== '23505') { // Ignore duplicate key errors
              console.error("Error creating onboarding preferences:", onboardingError);
            }
            
            toast.success("Profile created. Refreshing...");
            
            // Try to refresh user data
            await refreshUser();
            
            // Increment attempt count
            setAttemptCount(prev => prev + 1);
            
            // If still no user after refresh, reload the page
            if (!user) {
              window.location.reload();
            }
            
            return;
          } else {
            console.log("Profile exists but couldn't be loaded, trying to refresh...");
            // Profile exists but couldn't be loaded, try again
            await refreshUser();
            
            // Increment attempt count
            setAttemptCount(prev => prev + 1);
            
            // If still no user after multiple attempts, redirect to auth
            if (!user && attemptCount >= 2) {
              toast.error("Failed to load user data. Please try logging in again.");
              navigate("/auth", { replace: true });
            }
          }
        } catch (e) {
          console.error("Error in profile recovery:", e);
          toast.error("An error occurred. Please try logging in again.");
          navigate("/auth", { replace: true });
        } finally {
          setRetrying(false);
        }
      };
      
      checkAndFixProfile();
    }
  }, [isAuthenticated, user, userLoading, userError, navigate, retrying, attemptCount, refreshUser]);
  
  // Show a loading indicator while authentication is being checked
  if (authLoading || userLoading || retrying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-triage-purple">
          {retrying ? "Trying to recover your profile..." : "Loading..."}
        </div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  // Only render the outlet if we have both authentication and user data
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="text-triage-purple">Loading user data...</div>
          {attemptCount > 0 && (
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 text-sm bg-triage-purple text-white rounded-md"
            >
              Refresh
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return <Outlet />;
};

export default ProtectedRoute;

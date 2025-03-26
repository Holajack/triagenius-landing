
import { ReactNode, useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = () => {
  const { loading: authLoading, isAuthenticated } = useAuthState();
  const navigate = useNavigate();
  const { user, isLoading: userLoading, error: userError } = useUser();
  const [retrying, setRetrying] = useState(false);
  
  useEffect(() => {
    // Handle edge case when authenticated but user data fails to load
    if (isAuthenticated && !userLoading && !user && !retrying) {
      console.error("User authenticated but profile not loaded:", userError);
      
      // Try to check if profile actually exists
      const checkAndFixProfile = async () => {
        try {
          setRetrying(true);
          const { data: authData } = await supabase.auth.getUser();
          if (!authData.user) {
            toast.error("Session expired. Please log in again.");
            navigate("/auth", { replace: true });
            return;
          }
          
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
            
            toast.success("Profile created. Redirecting...");
            // Force a reload to ensure user data gets loaded properly
            window.location.reload();
            return;
          } else {
            // Profile exists but couldn't be loaded, try again or navigate to auth
            toast.error("Failed to load user data. Please try logging in again.");
            navigate("/auth", { replace: true });
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
  }, [isAuthenticated, user, userLoading, userError, navigate, retrying]);
  
  if (authLoading || userLoading || retrying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-triage-purple">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  // Only render the outlet if we have both authentication and user data
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-triage-purple">Loading user data...</div>
      </div>
    );
  }
  
  return <Outlet />;
};

export default ProtectedRoute;


import { ReactNode, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setAuthenticated(!!data.session);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthenticated(!!session);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-triage-purple">Loading...</div>
      </div>
    );
  }
  
  if (!authenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;

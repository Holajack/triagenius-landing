
import { ReactNode, useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";

const ProtectedRoute = () => {
  const { loading, isAuthenticated } = useAuthState();
  const navigate = useNavigate();
  const { user, isLoading: userLoading } = useUser();
  
  useEffect(() => {
    // Handle edge case when authenticated but user data fails to load
    if (isAuthenticated && !userLoading && !user) {
      toast.error("Failed to load user data. Please try logging in again.");
      navigate("/auth", { replace: true });
    }
  }, [isAuthenticated, user, userLoading, navigate]);
  
  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-triage-purple">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;

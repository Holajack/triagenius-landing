
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard = ({ children, requireAuth = true }: AuthGuardProps) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-triage-purple" />
      </div>
    );
  }

  if (requireAuth && !isSignedIn) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (!requireAuth && isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

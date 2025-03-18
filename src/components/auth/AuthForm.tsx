
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
  source?: string;
}

const AuthForm = ({ mode: initialMode, source }: AuthFormProps) => {
  const navigate = useNavigate();
  const isFromStartFocusing = source === "start-focusing";
  
  const [mode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPwa, setIsPwa] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  // Check if running as PWA
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    setIsPwa(isStandalone);
    
    if (isStandalone) {
      console.log('AuthForm: Running in PWA/standalone mode');
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      if (mode === "login") {
        // Handle login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          throw error;
        }
        
        toast.success("Welcome back to The Triage System!");
        
        // In PWA mode, add a slight delay to ensure state updates before navigation
        if (isPwa) {
          setTimeout(() => navigate("/dashboard"), 300);
        } else {
          navigate("/dashboard");
        }
      } else {
        // Handle signup
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              username,
            },
          },
        });
        
        if (error) {
          throw error;
        }
        
        toast.success("Welcome to The Triage System!");
        
        // If the user signed up from the "Start Focusing" button, take them to onboarding
        if (isFromStartFocusing || !data.session?.user.app_metadata.onboarding_completed) {
          // In PWA mode, add a slight delay to ensure state updates before navigation
          if (isPwa) {
            setTimeout(() => navigate("/onboarding"), 300);
          } else {
            navigate("/onboarding");
          }
        } else {
          // Otherwise, take them to the dashboard
          // In PWA mode, add a slight delay to ensure state updates before navigation
          if (isPwa) {
            setTimeout(() => navigate("/dashboard"), 300);
          } else {
            navigate("/dashboard");
          }
        }
      }
    } catch (error: any) {
      setError(error.message || "Authentication failed");
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleAuth} className="space-y-4">
        {mode === "signup" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
              />
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="pr-10"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        
        <Button
          type="submit"
          className="w-full bg-triage-purple hover:bg-triage-purple/90"
          disabled={loading}
        >
          {mode === "login" ? (
            <>
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Account
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default AuthForm;

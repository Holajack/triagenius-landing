
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, LogIn, UserPlus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { auth } from "@/integrations/firebase/client";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
  source?: string;
  previewMode?: boolean;
}

const AuthForm = ({ mode: initialMode, source, previewMode = false }: AuthFormProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromStartFocusing = source === "start-focusing";
  
  const [mode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailConfirmError, setEmailConfirmError] = useState(false);
  const [emailConfirmSent, setEmailConfirmSent] = useState(false);
  const [previewNotice, setPreviewNotice] = useState(previewMode);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  // Check for email confirmation
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      // Check if the URL has a confirmation token (from email link)
      const hash = location.hash;
      if (hash && hash.includes("type=signup")) {
        try {
          // Handle the confirmation token
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
          
          toast.success("Email confirmed successfully!");
          // Navigate to onboarding after confirmation
          navigate("/onboarding");
        } catch (error: any) {
          console.error("Email confirmation error:", error.message);
          toast.error("Failed to confirm email. Please try logging in.");
        }
      }
    };
    
    checkEmailConfirmation();
  }, [location, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEmailConfirmError(false);
    setEmailConfirmSent(false);
    
    try {
      if (mode === "login") {
        // Try Supabase login first
        const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (supabaseError) {
          // If Supabase login fails, try Firebase login
          try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Welcome back!");
            navigate("/dashboard");
            return;
          } catch (firebaseError: any) {
            throw supabaseError; // Use original Supabase error for consistency
          }
        } else {
          toast.success("Welcome back!");
          navigate("/dashboard");
        }
      } else {
        // For signup, try both providers with better error handling
        try {
          // Try Supabase signup first
          const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                username,
              },
              emailRedirectTo: `${window.location.origin}/auth#type=signup`,
            },
          });
          
          if (supabaseError) {
            if (supabaseError.message.includes("confirmation email")) {
              setEmailConfirmError(true);
              // Continue to Firebase signup even though there was an email error
            } else {
              throw supabaseError;
            }
          } else {
            // Handle email confirmation case
            if (supabaseData?.user?.identities?.length === 1 && !supabaseData.user.email_confirmed_at) {
              setEmailConfirmSent(true);
              toast.success("Account created! Please check your email to confirm your address.", {
                description: "You'll need to verify your email before you can log in.",
                duration: 8000,
              });
              
              // In preview mode, redirect to onboarding immediately after account creation
              if (previewMode) {
                try {
                  // Try Firebase signup as fallback
                  await createUserWithEmailAndPassword(auth, email, password);
                  toast.success("Account created successfully!");
                  
                  // Auto-redirect to onboarding in preview mode
                  setTimeout(() => {
                    navigate("/onboarding");
                  }, 1500); // Small delay to allow the user to see the success message
                  
                  return;
                } catch (firebaseError: any) {
                  // Even if Firebase fails, still redirect in preview mode
                  console.log("Firebase signup fallback failed:", firebaseError.message);
                  
                  setTimeout(() => {
                    navigate("/onboarding");
                  }, 1500);
                  
                  return;
                }
              }
              
              return;
            } else {
              toast.success("Account created successfully!");
              navigate("/onboarding");
              return;
            }
          }
        } catch (supabaseError: any) {
          // If Supabase signup fails with an email confirmation error, try Firebase
          console.log("Trying Firebase after Supabase error:", supabaseError);
        }
        
        // Try Firebase signup regardless of Supabase result due to email issues
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          toast.success("Account created with Firebase successfully!");
          navigate("/onboarding");
          return;
        } catch (firebaseError: any) {
          // In preview mode, redirect even if authentication fails
          if (previewMode) {
            toast.success("Preview mode: Redirecting to onboarding...");
            setTimeout(() => {
              navigate("/onboarding");
            }, 1500);
            return;
          }
          
          // Only throw if we didn't already succeed with Supabase
          if (emailConfirmError) {
            throw firebaseError;
          }
        }
      }
    } catch (error: any) {
      // In preview mode, redirect even after errors for signup
      if (previewMode && mode === "signup") {
        setError(error.message || "Authentication failed");
        toast.error("Authentication issue, but proceeding in preview mode");
        
        setTimeout(() => {
          navigate("/onboarding");
        }, 2000);
        
        return;
      }
      
      setError(error.message || "Authentication failed");
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border p-6">
      {previewNotice && (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-800" />
          <AlertTitle className="text-amber-800">Preview Environment Notice</AlertTitle>
          <AlertDescription className="text-amber-700">
            Email verification is limited in preview environments. Your account will be created and you'll be redirected to onboarding automatically.
            <Button 
              variant="link" 
              className="text-amber-800 p-0 h-auto font-normal underline underline-offset-2"
              onClick={() => setPreviewNotice(false)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {emailConfirmSent && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertTitle className="text-green-800">Email confirmation sent</AlertTitle>
          <AlertDescription className="text-green-700">
            We've sent a confirmation link to {email}. Please check your inbox and click the link to activate your account.
            {previewMode && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="text-sm font-medium">Since this is a preview environment, you've been automatically logged in.</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {emailConfirmError && (
        <Alert className="mb-4 bg-amber-50 border-amber-200">
          <AlertTitle className="text-amber-800">Email confirmation issue</AlertTitle>
          <AlertDescription className="text-amber-700">
            We're experiencing issues with our email confirmation system. You can still create an account and log in directly.
          </AlertDescription>
        </Alert>
      )}
      
      {error && !emailConfirmError && !emailConfirmSent && (
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
          disabled={loading || (emailConfirmSent && !previewMode)}
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
        
        {previewMode && mode === "signup" && (
          <p className="text-center text-sm text-gray-500 mt-2">
            In preview mode, you'll be automatically redirected to onboarding after account creation.
          </p>
        )}
      </form>
    </div>
  );
};

export default AuthForm;

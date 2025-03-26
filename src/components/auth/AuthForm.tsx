import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { auth } from "@/integrations/firebase/client";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Enable for debugging
const DEBUG_AUTH = true;

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
  source?: string;
}

const AuthForm = ({ mode: initialMode, source }: AuthFormProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromStartFocusing = source === "start-focusing";
  
  const [mode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailConfirmError, setEmailConfirmError] = useState(false);
  const [emailConfirmSent, setEmailConfirmSent] = useState(false);
  
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

  const createProfile = async (userId: string) => {
    try {
      // Get the current environment setting if available, use as initial value
      const currentEnvironment = localStorage.getItem('environment') || 'office';
      console.log('[AuthForm] Creating profile with environment:', currentEnvironment);
      
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          username: username || email.split('@')[0],
          last_selected_environment: currentEnvironment,
          privacy_settings: {
            showEmail: false,
            showActivity: true
          }
        });
        
      if (error) {
        console.error("Error creating profile:", error);
        return false;
      }
      
      console.log('[AuthForm] Profile created successfully');
      
      // Also create onboarding preferences
      const { error: onboardingError } = await supabase
        .from('onboarding_preferences')
        .insert({
          user_id: userId,
          learning_environment: currentEnvironment
        });
        
      if (onboardingError && onboardingError.code !== '23505') { // Ignore duplicate key errors
        console.error("[AuthForm] Error creating onboarding preferences:", onboardingError);
      }
      
      return true;
    } catch (err) {
      console.error("Error creating profile:", err);
      return false;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEmailConfirmError(false);
    setEmailConfirmSent(false);
    
    try {
      if (mode === "login") {
        if (DEBUG_AUTH) console.log('[AuthForm] Attempting login with email:', email);
        
        // Try Supabase login
        const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (supabaseError) {
          // If Supabase login fails, try Firebase login
          try {
            if (DEBUG_AUTH) console.log('[AuthForm] Supabase login failed, trying Firebase');
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Welcome back!");
            navigate("/dashboard");
            return;
          } catch (firebaseError: any) {
            if (DEBUG_AUTH) console.log('[AuthForm] Firebase login also failed');
            throw supabaseError; // Use original Supabase error for consistency
          }
        } else {
          if (DEBUG_AUTH) console.log('[AuthForm] Login successful, checking profile');
          
          // Check if profile exists, create if needed
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', supabaseData.user.id)
            .maybeSingle();
            
          if (!profileData) {
            if (DEBUG_AUTH) console.log('[AuthForm] Profile not found, creating');
            const profileCreated = await createProfile(supabaseData.user.id);
            if (!profileCreated) {
              toast.warning("Profile creation issues. Some features may be limited.");
            }
          }
          
          toast.success("Welcome back!");
          navigate("/dashboard");
        }
      } else {
        // For signup, try both providers with better error handling
        try {
          if (DEBUG_AUTH) console.log('[AuthForm] Attempting signup with email:', email);
          
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
              
              // Try to create profile anyway to avoid issues later
              if (supabaseData?.user?.id) {
                await createProfile(supabaseData.user.id);
              }
              
              return;
            } else {
              // Create profile for the new user
              if (supabaseData?.user?.id) {
                await createProfile(supabaseData.user.id);
              }
              
              toast.success("Account created successfully!");
              navigate("/onboarding");
              return;
            }
          }
        } catch (supabaseError: any) {
          // If Supabase signup fails with an email confirmation error, try Firebase
          console.log("Trying Firebase after Supabase error:", supabaseError.message);
        }
        
        // Try Firebase signup regardless of Supabase result due to email issues
        try {
          if (DEBUG_AUTH) console.log('[AuthForm] Trying Firebase signup');
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          
          // Try to create a profile in our database for this Firebase user
          if (userCredential?.user?.uid) {
            await createProfile(userCredential.user.uid);
          }
          
          toast.success("Account created with Firebase successfully!");
          navigate("/onboarding");
          return;
        } catch (firebaseError: any) {
          // Only throw if we didn't already succeed with Supabase
          if (emailConfirmError) {
            throw firebaseError;
          }
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      setError(error.message || "Authentication failed");
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border p-6">
      {emailConfirmSent && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertTitle className="text-green-800">Email confirmation sent</AlertTitle>
          <AlertDescription className="text-green-700">
            We've sent a confirmation link to {email}. Please check your inbox and click the link to activate your account.
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
          disabled={loading || emailConfirmSent}
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

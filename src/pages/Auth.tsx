
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthForm from "@/components/auth/AuthForm";
import { PostSignupPlans } from "@/components/auth/PostSignupPlans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEBUG_AUTH = true;

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromStartFocusing = location.state?.source === "start-focusing";
  const initialMode = location.state?.mode || "login";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [savedSessionFound, setSavedSessionFound] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [isNewSignup, setIsNewSignup] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking auth session:", error);
          setIsCheckingAuth(false);
          return;
        }
        
        const isLoggedIn = !!data.session;
        if (DEBUG_AUTH) console.log('[Auth] User authenticated:', isLoggedIn);
        setIsAuthenticated(isLoggedIn);
        
        const hash = location.hash;
        const isEmailConfirmation = hash && hash.includes("type=signup");
        
        try {
          const keys = Object.keys(localStorage);
          const sessionKeys = keys.filter(key => key.startsWith('sessionData_'));
          
          if (sessionKeys.length > 0) {
            setSavedSessionFound(true);
          }
        } catch (error) {
          console.error("Error checking for saved sessions:", error);
        }
        
        if (isLoggedIn) {
          if (isEmailConfirmation) {
            navigate("/onboarding");
          } else if (isFromStartFocusing) {
            navigate("/onboarding");
          } else {
            navigate("/dashboard");
          }
        }
      } catch (err) {
        console.error("Error in checkAuth:", err);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (DEBUG_AUTH) console.log('[Auth] Auth state change:', event, session?.user?.id);
      const isLoggedIn = !!session;
      setIsAuthenticated(isLoggedIn);
      
      if (event === 'SIGNED_IN') {
        // Determine if this is a new user by checking for metadata or other indicators
        const isNewUser = session?.user?.app_metadata?.provider === 'email' && 
                         !session?.user?.app_metadata?.last_sign_in_at;
                         
        setIsNewSignup(isNewUser);
        toast.success("Signed in successfully!");
        
        const ensureProfile = async () => {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle();
              
            if (profileError || !profile) {
              console.log('[Auth] Creating profile for new user:', session.user.id);
              
              const { error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  username: session.user.email?.split('@')[0] || 'user',
                  last_selected_environment: 'office'
                });
                
              if (createError) {
                console.error('[Auth] Failed to create profile:', createError);
              } else {
                console.log('[Auth] Profile created successfully');
              }
              
              const { error: prefError } = await supabase
                .from('onboarding_preferences')
                .insert({
                  user_id: session.user.id,
                  learning_environment: 'office'
                });
                
              if (prefError && prefError.code !== '23505') {
                console.error('[Auth] Failed to create onboarding preferences:', prefError);
              }
              
              // If we're creating a profile, it's definitely a new user
              setIsNewSignup(true);
            }
          } catch (err) {
            console.error('[Auth] Error ensuring profile exists:', err);
          }
        };
        
        ensureProfile().then(() => {
          if (isNewUser || isNewSignup) {
            setShowPlans(true);
          } else {
            navigate("/dashboard");
          }
        });
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, isFromStartFocusing, location.hash, location]);
  
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-triage-purple">Checking authentication...</div>
      </div>
    );
  }
  
  if (isAuthenticated && !showPlans) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-triage-purple">Redirecting to dashboard...</div>
      </div>
    );
  }
  
  if (showPlans) {
    return <PostSignupPlans />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50/30 flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Button>
        
        <div className="max-w-md mx-auto">
          {isFromStartFocusing ? (
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">Create Your Account</h1>
              <p className="text-sm text-triage-purple bg-purple-50 p-3 rounded-lg">
                Create an account to start your focus journey and track your progress
              </p>
            </div>
          ) : (
            <h1 className="text-2xl font-bold mb-6 text-center">
              {initialMode === "login" ? "Welcome Back" : "Join The Triage System"}
            </h1>
          )}
          
          {savedSessionFound && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-700">
                We found saved sessions from a previous login. Sign in to restore your preferences and continue your progress.
              </p>
            </div>
          )}
          
          <Tabs defaultValue={isFromStartFocusing ? "signup" : initialMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <AuthForm mode="login" source={location.state?.source} />
            </TabsContent>
            
            <TabsContent value="signup">
              <AuthForm mode="signup" source={location.state?.source} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;

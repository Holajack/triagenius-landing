
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthForm from "@/components/auth/AuthForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromStartFocusing = location.state?.source === "start-focusing";
  const initialMode = location.state?.mode || "login";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [emailConfirmSuccess, setEmailConfirmSuccess] = useState(false);
  
  // Determine if we're in a preview environment
  const isPreviewEnvironment = window.location.hostname.includes('lovableproject.com') || 
                               window.location.hostname.includes('localhost');

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      const { data } = await supabase.auth.getSession();
      const isLoggedIn = !!data.session;
      setIsAuthenticated(isLoggedIn);
      
      // Check for email confirmation from URL hash
      const hash = location.hash;
      const isEmailConfirmation = hash && hash.includes("type=signup");
      
      if (isEmailConfirmation) {
        try {
          // Handle the confirmation token
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
          
          setEmailConfirmSuccess(true);
          toast.success("Email confirmed successfully!");
          
          // If already authenticated after confirmation, redirect to onboarding
          if (isLoggedIn) {
            navigate("/onboarding");
          }
        } catch (error: any) {
          console.error("Email confirmation error:", error.message);
          toast.error("Failed to confirm email. Please try logging in.");
        }
      } else if (isLoggedIn) {
        // Regular redirect for already logged in users
        if (isFromStartFocusing) {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
      }
      
      setIsCheckingAuth(false);
    };
    
    checkAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isLoggedIn = !!session;
      setIsAuthenticated(isLoggedIn);
      
      if (event === 'SIGNED_IN') {
        // Handle signed in event
        if (isFromStartFocusing) {
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
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
  
  if (isAuthenticated) {
    return null; // Don't render anything while redirecting
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
          
          {emailConfirmSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <h2 className="text-xl font-semibold text-green-700 mb-3">Email Confirmed!</h2>
              <p className="text-green-600 mb-4">
                Your email has been successfully verified. You can now log in to your account.
              </p>
              <Button 
                className="w-full bg-triage-purple hover:bg-triage-purple/90"
                onClick={() => setEmailConfirmSuccess(false)}
              >
                Log In Now
              </Button>
            </div>
          ) : (
            <Tabs defaultValue={isFromStartFocusing ? "signup" : initialMode} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <AuthForm mode="login" source={location.state?.source} />
              </TabsContent>
              
              <TabsContent value="signup">
                <AuthForm 
                  mode="signup" 
                  source={location.state?.source} 
                  previewMode={isPreviewEnvironment} 
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;

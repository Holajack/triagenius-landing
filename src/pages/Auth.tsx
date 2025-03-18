
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
  const isFromStartFocusing = location.state?.source === "start-focusing" || location.pathname === "/auth";
  const initialMode = location.state?.mode || "login";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPwa, setIsPwa] = useState(false);
  const [isMobilePwa, setIsMobilePwa] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check network status
    setIsOffline(!navigator.onLine);
    
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
      
      // Show toast when coming back online
      if (navigator.onLine) {
        toast.success("You're back online!");
      } else {
        toast.warning("You're offline. Limited functionality available.");
      }
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    // Check if running as PWA and if on mobile
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    setIsPwa(isStandalone);
    
    // Check if on mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobilePwa(isStandalone && isMobile);
    
    if (isStandalone) {
      console.log('Auth: Running in PWA/standalone mode, Mobile:', isMobile);
    }
    
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          setIsAuthenticated(true);
          
          // Check onboarding status
          try {
            const { data: onboardingData } = await supabase
              .from('onboarding_preferences')
              .select('is_onboarding_complete')
              .eq('user_id', data.session.user.id)
              .maybeSingle();
            
            // If onboarding not completed, redirect to onboarding
            if (!onboardingData?.is_onboarding_complete) {
              // For mobile PWA, always use direct navigation
              if (isMobilePwa) {
                console.log('Mobile PWA: Redirecting directly to onboarding');
                navigate("/onboarding");
              } else {
                // For browser or desktop, use original approach
                navigate("/onboarding");
              }
              return;
            }
          } catch (error) {
            console.error("Error checking onboarding status:", error);
          }
          
          // If already authenticated, redirect to appropriate page
          if (isFromStartFocusing) {
            // For mobile PWA, use direct navigation
            if (isMobilePwa) {
              console.log('Mobile PWA: Redirecting directly to focus session');
              navigate("/focus-session");
            } else {
              // For browser or desktop, use original approach
              navigate("/focus-session");
            }
          } else {
            // For mobile PWA, use direct navigation
            if (isMobilePwa) {
              console.log('Mobile PWA: Redirecting directly to dashboard');
              navigate("/dashboard");
            } else {
              // For browser or desktop, use original approach
              navigate("/dashboard");
            }
          }
        } else {
          // Not authenticated, stay on auth page
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, isFromStartFocusing]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-triage-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return null; // Don't render anything while redirecting
  }
  
  // For mobile PWA, simplify the UI
  if (isMobilePwa) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50/30 flex flex-col">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            {isOffline && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md text-sm">
                <p className="font-medium mb-1">You are currently offline</p>
                <p className="text-xs">
                  You can still sign in if you've logged in before, but new registrations require an internet connection.
                </p>
              </div>
            )}
            
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">
                {isFromStartFocusing ? "Create Your Account" : "Welcome Back"}
              </h1>
              {isFromStartFocusing && (
                <p className="text-sm text-triage-purple bg-purple-50 p-3 rounded-lg">
                  Create an account to start your focus journey and track your progress
                </p>
              )}
            </div>
            
            <Tabs defaultValue={isFromStartFocusing ? "signup" : initialMode} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <AuthForm 
                  mode="login" 
                  source={isFromStartFocusing ? "start-focusing" : location.state?.source} 
                />
              </TabsContent>
              
              <TabsContent value="signup">
                <AuthForm 
                  mode="signup" 
                  source={isFromStartFocusing ? "start-focusing" : location.state?.source} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }
  
  // Standard browser version
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
          {isOffline && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md text-sm">
              <p className="font-medium mb-1">You are currently offline</p>
              <p className="text-xs">
                You can still sign in if you've logged in before, but new registrations require an internet connection.
              </p>
            </div>
          )}
          
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
          
          <Tabs defaultValue={isFromStartFocusing ? "signup" : initialMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <AuthForm 
                mode="login" 
                source={isFromStartFocusing ? "start-focusing" : location.state?.source} 
              />
            </TabsContent>
            
            <TabsContent value="signup">
              <AuthForm 
                mode="signup" 
                source={isFromStartFocusing ? "start-focusing" : location.state?.source} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
